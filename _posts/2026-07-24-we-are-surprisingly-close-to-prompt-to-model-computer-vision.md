---
title: We are surprisingly close to prompt-to-model in computer vision
layout: post
permalink: /prompt-to-model/
---

In computer vision, neural networks have become a commodity. You are a Google search away from downloading near-SOTA neural networks that are free, open source, have a permissive license, and are capable enough for most use cases.

Take Rekor, ZeroEyes, Intenseye, and Tiliter. I am not certain how their products are really implemented, but at least in theory, they could be replicated just by taking whatever recent YOLO flavour you like and training it for the specific task.

The only real MOAT these companies have, at least from the technical POV, is the dataset. These companies had to spend their capital on capturing real-world footage and photos and labelling this footage and these photos.

Depending on the specific task, this can be more or less capital intensive. For certain use cases, this can be easily and cheaply outsourced. At other times, it requires trained or specialized personnel to capture the footage or annotate it.

This moat is getting shallower. Thanks to diffusion models it is now possible to generate realistic images and use them to train the models. A few weeks ago I came across [this paper](https://doi.org/10.1016/j.atech.2024.100614) which used a diffusion model to generate images of apples in an orchard, then trained some YOLO models on this dataset. I love it!
Still, you would need to annotate the images, but that can also be streamlined with a segmentation model, like SAM3. This was proposed in [this paper](https://arxiv.org/html/2411.16196v1).

At the end of the day this is just using highly capable models, which are (somewhat) heavy to run, to generate and label the data that small, efficient models learn from. I find this kind of knowledge transfer neat! I like the idea so much that I decided to check if this pipeline could be replicated on consumer hardware. The task I picked: detecting wrenches in real-world photos. This is arguably an easy task, wrenches are common enough that both image generation models and segmentation models can detect them. Solutions exist if the object you care about is not a common one.

<div style="display: flex; justify-content: center;">
  <figure style="margin: 0; width: 100%;">
    <img src="/assets/wrenches/teaser.png" alt="The pipeline: prompt, FLUX.2-klein-9B, SAM 3, train YOLO26n, inference" style="width: 100%; object-fit: contain;">
    <figcaption style="font-size: 0.85em; text-align: center;">The whole pipeline.</figcaption>
  </figure>
</div>

<div style="display: flex; justify-content: center;">
  <figure style="margin: 0; width: 75%;">
    <img src="/assets/neofetch.png" alt="neofetch" style="width: 100%; height: 300px; object-fit: contain;">
    <figcaption style="font-size: 0.85em; text-align: center;">The hardware I used to generate the images and train the model. In 2026 this is by no means a beefy box.</figcaption>
  </figure>
</div>

I procedurally generated the prompts to include diverse context, background and lighting, then I used [Flux Klein 9B](https://huggingface.co/black-forest-labs/FLUX.2-klein-9B) to actually generate a total of just under 1000 images of wrenches.


<div style="display: flex; gap: 1rem; margin: 1rem 0;">
  <figure style="margin: 0; width: 50%;">
    <img src="/assets/wrenches/gen_studio.jpg" alt="Generated studio wrench" style="width: 100%; height: 300px; object-fit: contain;">
    <figcaption style="font-size: 0.85em; text-align: center;">Studio shot</figcaption>
  </figure>
  <figure style="margin: 0; width: 50%;">
    <img src="/assets/wrenches/gen_garage.jpg" alt="Generated wrench in a garage" style="width: 100%; height: 300px; object-fit: contain;">
    <figcaption style="font-size: 0.85em; text-align: center;">Garage bench</figcaption>
  </figure>
</div>
<div style="display: flex; gap: 1rem; margin: 1rem 0;">
  <figure style="margin: 0; width: 50%;">
    <img src="/assets/wrenches/gen_fan.jpg" alt="Generated fan of wrenches" style="width: 100%; height: 300px; object-fit: contain;">
    <figcaption style="font-size: 0.85em; text-align: center;">Wrench set</figcaption>
  </figure>
  <figure style="margin: 0; width: 50%;">
    <img src="/assets/wrenches/gen_pile.jpg" alt="Generated pile of wrenches" style="width: 100%; height: 300px; object-fit: contain;">
    <figcaption style="font-size: 0.85em; text-align: center;">Pile of wrenches</figcaption>
  </figure>
</div>

My machine is not beefy enough to load the text encoder (a Qwen3 LLM that turns the prompt into the embeddings the diffusion model conditions on) and the actual model at the same time. So I had to first load just the text encoder, generate the inputs for the model, and then load the actual diffusion model and stream the inputs to it. Even so, the 9B model is way too big for my 6GB of VRAM, so it spilled to the 16GB of RAM and a bit of the SSD swap. I ran the model without quantization. This configuration resulted in a generation time of around two minutes per image. Quite slow but still reasonable, ~33 hours for the whole training dataset.

Then I used [SAM-3](https://ai.meta.com/research/sam3/) to detect the wrenches in the images. SAM-3 works incredibly well and fits comfortably in my GPU.

<div style="display: flex; gap: 1rem; margin: 1rem 0;">
  <figure style="margin: 0; width: 50%;">
    <img src="/assets/wrenches/box_approved_single.jpg" alt="Approved image with SAM-3 bounding box" style="width: 100%; height: 300px; object-fit: contain;">
    <figcaption style="font-size: 0.85em; text-align: center;">Approved</figcaption>
  </figure>
  <figure style="margin: 0; width: 50%;">
    <img src="/assets/wrenches/box_approved_dense.jpg" alt="Approved in-context photo with SAM-3 bounding box" style="width: 100%; height: 300px; object-fit: contain;">
    <figcaption style="font-size: 0.85em; text-align: center;">Approved</figcaption>
  </figure>
</div>
<div style="display: flex; gap: 1rem; margin: 1rem 0;">
  <figure style="margin: 0; width: 50%;">
    <img src="/assets/wrenches/box_discarded_wrench.jpg" alt="Discarded image, bent and melted wrench" style="width: 100%; height: 300px; object-fit: contain;">
    <figcaption style="font-size: 0.85em; text-align: center;">Discarded, the red wrench escaped from area 51</figcaption>
  </figure>
  <figure style="margin: 0; width: 50%;">
    <img src="/assets/wrenches/box_discarded_tireshop.jpg" alt="Discarded image, toy-like plastic wrenches" style="width: 100%; height: 300px; object-fit: contain;">
    <figcaption style="font-size: 0.85em; text-align: center;">Discarded, the gpu was so hot that it melted the wrenches :O</figcaption>
  </figure>
</div>

As you can see in the previous images, not all the generated photos were good enough. Another failure scenario is that SAM3 sometimes labeled random objects as wrenches or failed to label some of the wrenches. So I had to manually cherry-pick the images that contain good looking wrenches and are properly annotated by SAM3. I ended up with 515 approved images out of the ~1000 I reviewed.

I vibe coded a web interface to approve/discard the images and reviewing the whole dataset took around 15 minutes.

Before training, I applied [albumentations](https://albumentations.ai/) (blurs, downscaling, sharpening) on the photos in an attempt to reduce the gap between artificial and real images. About a third of the training images contain no wrench at all: hard negatives with confuser objects (pliers, breaker bars, screwdrivers) and plain wrench-free scenes, some of them sampled from COCO. These keep the false positives in check.


To measure how much of this transfers to the real world, I also built an evaluation dataset by hand. I downloaded 137 real photos from the web and manually annotated them with bounding boxes (48 photos with wrenches, 30 hard negatives with wrench-like tools, 59 wrench-free scenes). I used them as the validation split during training, so they are not a strict holdout: they influenced checkpoint selection.

I used this setup to fine tune a YOLO 26n. After 200 epochs, evaluated on this validation set, the model scores:

- precision: 0.92
- recall: 0.71
- mAP@0.5: 0.82
- mAP@0.5:0.95: 0.64

<div style="display: flex; justify-content: center;">
  <figure style="margin: 0; width: 75%;">
    <img src="/assets/wrenches/train_results.png" alt="Training curves" style="width: 100%; object-fit: contain;">
    <figcaption style="font-size: 0.85em; text-align: center;">Training curves. The validation split is made of real photos, so these numbers measure the synthetic-to-real gap directly.</figcaption>
  </figure>
</div>

And this is what the model (blue boxes) predicts on real photos it has never seen, against the hand-drawn ground truth (green):

<div style="display: flex; gap: 1rem; margin: 1rem 0;">
  <figure style="margin: 0; width: 50%;">
    <img src="/assets/wrenches/real_inference_row.jpg" alt="Inference on real photo, seven wrenches" style="width: 100%; height: 300px; object-fit: contain;">
    <figcaption style="font-size: 0.85em; text-align: center;">Seven out of seven, no false positives</figcaption>
  </figure>
  <figure style="margin: 0; width: 50%;">
    <img src="/assets/wrenches/real_inference_mat.jpg" alt="Inference on real photo, two adjustable wrenches" style="width: 100%; height: 300px; object-fit: contain;">
    <figcaption style="font-size: 0.85em; text-align: center;">Spot on, adjustable wrenches</figcaption>
  </figure>
</div>

<div style="display: flex; justify-content: center;">
  <figure style="margin: 0; width: 50%;">
    <img src="/assets/wrenches/real_inference_miss.jpg" alt="Missed detection, hand holding an adjustable wrench" style="width: 100%; height: 300px; object-fit: contain;">
    <figcaption style="font-size: 0.85em; text-align: center;">Missed. Probably because it is partially occluded by the hand, a case barely represented in the training data.
</figcaption>
  </figure>
</div>

There is room for improvement. But I think it proves the point: all you need to build a fairly functional specialized object detection model is a consumer GPU from January 2019 (!!!). You do not even need to leave your house or start taking pictures. The only manual step in the training pipeline is to cherry pick the good images and discard the bad ones.

The current limitation is the image generation model. FLUX.2 klein 9B punches way above his weight but if I had a more generous VRAM budged I could have runned model that generate images that are more photorealistic. I'd bet there is plenty of low-hanging fruit in this workflow that would improve the end result. Switching to a better image generation model is just one of them.

It is interesting to see how this is going to pan out as more capable diffusion and segmentation models are released. In the meantime, if you want to have a closer look, everything is in this repo: [github.com/StefanoPetrilli/numeri](https://github.com/StefanoPetrilli/numeri).