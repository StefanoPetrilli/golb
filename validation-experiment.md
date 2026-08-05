# Validation experiment — implementation handover

Small-scale end-to-end run of the copy-paste pipeline before committing to the
full sweep. **Context and rationale:** `_posts/2026-08-02-paper.md` (Test setup
section). This file is self-contained; you do not need to read the papers.

**Owner is on vacation — this document is the spec.** Follow it literally.
Where it gives decision rules, apply them; where it doesn't cover a failure,
stop, write down what happened in `NOTES.md`, and move to the next independent
step. Do not improvise design changes.

## Goals and success criteria

1. Dataset-generation pipeline works (images look right, labels stay valid).
2. Training/eval loop runs on the RTX 2060 6GB within budget.
3. AP@0.5 ordering at 10k volume: matched > mismatched. If matched ≈ mismatched
   or inverted, that is still a valid result — report it, do **not** tune
   anything to "fix" it.

**Done means** (all deliverables in the repo):

- [ ] Taskfile.yaml with all `pipeline:*` tasks below working end to end
- [ ] `data/generated/` with the three arm datasets + a 4×5 sample grid per arm (JPG)
- [ ] `results/validation_runs.csv` — one row per run (run name, images, epochs, AP@0.5, FN/img, pred/img, wall time)
- [ ] `results/ap_vs_volume.png` — AP@0.5 vs volume, one line per arm
- [ ] `NOTES.md` — deviations, failures, timings, anything odd

## Design

3 arms × 2 volumes + baseline, 1 seed, YOLO26m. **7 training runs.**

| Run | Training images | Epochs |
|---|---|---|
| baseline | 118,287 (COCO train2017) | 10 |
| matched / mismatched / procedural × 1k | 118,287 + 1,000 | 10 |
| matched / mismatched / procedural × 10k | 118,287 + 10,000 | 10 |

Nested subsets: the 1k pool is the **first 1k** of the 10k pool, so volume is
the only difference between volume levels. Generation seed: 0.

## Machine and budget

- GPU: RTX 2060 6GB. Expect ~40–50 h total GPU time; per-run wall time
  baseline ≈ 4 h, 1k runs ≈ 4 h, 10k runs ≈ 4.5 h. If a run takes > 8 h,
  something is wrong — check AMP is on and batch isn't 1.
- Disk: ~40 GB (COCO train 19 GB + val 1 GB + Places365 val ~1 GB + ~63k
  generated images ~10 GB + checkpoints).
- Generation is CPU-bound PIL work (~0.3 s/image): ~5 h serial, < 1 h with
  multiprocessing. Parallelize it.

## Infrastructure: go-task

One namespaced task per pipeline stage, runnable in order and individually.
Stages must be idempotent (skip work if outputs exist) so a crashed stage can
be re-run without redoing earlier ones.

```yaml
# Taskfile.yaml — skeleton; fill in the cmds per stage specs below
version: '3'
tasks:
  pipeline:setup:        # stage 0: deps + all downloads + dir layout
  pipeline:backgrounds:  # stage 1: Places365 → per-category bg pool
  pipeline:binning:      # stage 2: npmi.csv → matched/mismatched place lists
  pipeline:generate:     # stage 3: arm datasets + sample grids
  pipeline:train:        # stage 4: 7 training runs (or pipeline:train:RUN for one)
  pipeline:eval:         # stage 5: eval all runs on the 990 split → CSV
  pipeline:analysis:     # stage 6: plot + report
  pipeline:all:
    deps: [pipeline:setup, pipeline:backgrounds, pipeline:binning,
           pipeline:generate, pipeline:train, pipeline:eval, pipeline:analysis]
```

`pipeline:train` must also accept running a single config
(`task pipeline:train RUN=matched_10k`) so runs can be resumed/retried
individually. Use `sources`/`generates` or fingerprint checks for idempotency.

## Stage specs

### 0 — setup

```bash
pip install -r requirements.txt ultralytics   # requirements.txt from the ContextShift repo
yolo download model=yolo26m.pt
```

Downloads:

| What | Where | Size |
|---|---|---|
| ContextShift code (zip; anonymous git clone does NOT work) | `curl -L "https://anonymous.4open.science/api/repo/ContextShiftBenchmark-0D3E/zip" -o cs.zip && unzip cs.zip -d vendor/contextshift` | ~MBs |
| COCO train2017 images + annotations | http://images.cocodataset.org/zips/train2017.zip, http://images.cocodataset.org/annotations/annotations_trainval2017.zip | 19 GB |
| COCO val2017 images | http://images.cocodataset.org/zips/val2017.zip | 1 GB |
| Places365 val (256px) | http://data.csail.mit.edu/places/places365/val_256.tar | ~1 GB |

Layout: `data/coco2017/{train,val,annotations}`, `data/places365/bg_images`,
`vendor/contextshift`, `data/generated`, `results`, `checkpoints/yolo26m.pt`.

### 1 — backgrounds

Run `vendor/contextshift/src/scripts/build_bg_images_dataset.py` against the
Places365 val split → `data/places365/bg_images/<category>/*.jpg`.

**Known deviation:** ContextShift pre-filters backgrounds with YOLO-World to
remove images containing objects (`empty_detections/`). We skip this in
validation — a stray unlabeled object in a background is acceptable label
noise here. The full setup must not skip it.

### 2 — binning

`vendor/contextshift/configs/compatibility/coco80/npmi.csv` (366 Places365
places × 80 COCO classes, continuous NPMI in [−1,1], rows = places, first
column header `place`). Per COCO class, over places with non-−1 NPMI:

- matched = places in the **top quartile**
- mismatched = places in the **bottom quartile**

Output: `data/binning/{matched,mismatched}/<coco_class>.txt` (one place per
line). ~20 lines of pandas. Sanity check to include in output: print the lists
for `dog` and `boat` — matched should contain obvious scenes (e.g. kennel /
harbor-like places), mismatched should not.

### 3 — generate

Reuse, verified present in the vendored repo:

- Compositing: `src/manipulation/bg_swap/bg_swap_replacer.py` →
  `swap_background(image, instance, background_image)` — extracts one
  polygon-masked instance, pastes onto a background resized to source dims;
  feathering, mask erosion, luminance matching built in. **Bbox/segmentation
  stay valid because the object never moves.**
- Procedural arm: `src/manipulation/segmentation/background/{solid_color,smooth_gradient,low_freq_noise}_replacer.py` — in-place background replacement around the object.
- Driver to adapt: `src/manipulation/bg_swap/build_bg_swap_datasets.py`.

Write a driver that:

1. Lists train2017 images with **exactly one polygon-annotated instance**
   (`iscrowd=0`) — expect ~40k; if < 15k, stop and note it.
2. Samples 10,000 of them (seed 0).
3. Per sampled image emits **one variant per arm** — same object, same
   position; only the background differs:
   - matched: random place from the class's matched list
   - mismatched: random place from the class's mismatched list
   - procedural: one of the three replacers (rotate solid/gradient/noise)
4. Writes YOLO-format labels (`<img>.txt`, `class x_center y_center w h`
   normalized) — the bbox is unchanged from the source annotation.
5. Writes per arm: `data/generated/{matched,mismatched,procedural}/{images,labels}`.
6. Saves a 4×5 sample grid per arm to `results/samples_<arm>.jpg` and **look at
   them** before proceeding — objects pasted whole, no obvious fringes, labels
   visually on-object.

The 1k dataset = first 1,000 images of the 10k arm dataset (symlink or copy).

### 4 — train

Per run, Ultralytics Python API:

```python
from ultralytics import YOLO
model = YOLO("checkpoints/yolo26m.pt")
model.train(data="<run>.yaml", epochs=10, batch=16, imgsz=640, amp=True,
            mosaic=0.0, fliplr=0.0, copy_paste=0.0, seed=0,
            project="results/train", name="<run>")
```

Everything else at Ultralytics defaults (optimizer auto/SGD, lr0 0.01, cosine).
Dataset yaml: train = train2017 images + arm images; val = the 990 split (next
stage).

Rules:

- **OOM → drop to batch=8 and re-run that config AND every config already run**
  (batch must be identical across all 7 runs; comparability beats throughput).
- Do not enable any other augmentation. Do not early-stop.
- Log wall time per run.

### 5 — eval

Eval split: **990 images sampled from COCO val2017 with `random.seed(0)`** —
our own reproducible split; ContextShift's exact 990 are not recoverable from
their public repo and matching them is not required for validation.

Per trained run, on the 990 split:

- AP@0.5: `model.val(data=..., split="val")` → `results_dict["metrics/mAP50(B)"]`.
- FN/img and pred/img: run `model.predict` over the split at conf 0.25 and
  count (a ground-truth box with no matching prediction ≥ 0.5 IoU = FN;
  matching = same class). ~30 lines; put it in `src/eval_count.py`.

Append one row per run to `results/validation_runs.csv`.

### 6 — analysis

One plot: AP@0.5 (y) vs augmented volume {0, 1k, 10k} (x, log), one line per
arm, from the CSV → `results/ap_vs_volume.png`. Write 3–5 sentences at the top
of `NOTES.md`: ordering observed, anything weird, go/no-go recommendation for
the full sweep.

## Time budget (RTX 2060)

| Stage | Expected |
|---|---|
| setup + downloads | 1–2 h (mostly download) |
| backgrounds | < 15 min |
| binning | minutes |
| generate (63k images, 8 procs) | < 1 h |
| train (7 runs) | 40–50 h |
| eval | < 1 h |
| **Total** | **~3 days** |

## Extension path to the full setup (do NOT implement now)

For context only: larger volumes, 3 seeds, Places365-train + YOLO-World
background filter, multi-object pasting (1–3 instances via
`vendor/contextshift/src/manipulation/object_paster.py`), VOC'12 replication
block, contingent from-scratch control. If validation succeeds these are config
+ compute on top of this pipeline, not new infrastructure.
