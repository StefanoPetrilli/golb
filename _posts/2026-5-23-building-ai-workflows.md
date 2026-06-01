---
title: Lessons from a weekend building local AI workflows
layout: post
permalink: /building-ai-workflows/
---

Like everyone and their grandmother these days, I am into Agents! More like an user than like a creator so far but I could finally spent a weekend to learn more on agentic workflows. I started this project with a naive understanding which gave birth to a naive workflow. As soon as the workflow I first came up with hit the messy reality, it broke down. Everything was broken. As I kept thinkering and exploring, my understanding and the workflow architecture evolved with it.

The workflow I wanted to build actually sort of works and you can find the repo here if you want to try it out: [repo]

The whole thing is an agentic video editor which takes a video and strips down all the fluff so you can just watch the juicy parts.
YouTube has a minimum video length for mid-roll monetization of 8 minutes. A lot of the videos on the platform could convey the same message in 1 minute but they have to overly water down the message so that you can ultimately be fed with more advertisements. To keep the engagement high even while watering down the content, dark patterns, like cliffhangers and generating hype with fluff are used making it difficult to leave the video once started.

How would these videos look like if creators put respect for your time before metrics and money? This was the other questio I had in mind when I decided to build this.

Ultimately the result is funny but still very raw.

## Naive solution

The first naive solution which came to my mind is the following:

graph LR
    A[Initial Video] --> B[Transcription]
    B --> C[Editor Agent]
    B --> D[Reviewer Agent]
    C --> D
    D == Not Good ==> C
    D ==>|Good| E[Video Editing Agent]
    E --> F[final video]


I would take a video, run it trough a speech to text model to get the transcription, feed the full video transcript into an editor agent tasked with deciding what are the most important segments, then I would feed the selection to a Reviewer Agent which would be tasked to decide whether the selected sections of the video actually preserve the message.
In my plan, the editor agent and the reviewer agent would go back and fort untill the reviewer agent agrees with the selection made by the editor agent.
Finally the sections would be passed to a Video Editing Agent which knows how to use FFMpeg and takes care of generating the video with all the choosen parts.

If you are curious to look at the end result of this first version, the left version is an original fluffy video and the one on the right is the output of this version:

Spoiler Alert: it does not look any good.

<iframe width="560" height="315" src="https://www.youtube.com/embed/tPcOFvEk_qs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe><div style="display: flex; gap: 20px;">
  <div style="flex: 1;">
    <h3>Original</h3>
    <iframe width="100%" height="315" src="https://www.youtube.com/embed/tvL4FF2lMnw" frameborder="0" allowfullscreen></iframe>
  </div>
  <div style="flex: 1;">
    <h3>First Iteration Version</h3>
    <iframe width="100%" height="315" src="https://www.youtube.com/embed/ZI_BlwMbuKI" frameborder="0" allowfullscreen></iframe>
  </div>
</div>

It sounded easy and straight forward on paper but when the video came out on the other side of the pipeline, it did not look good.

### Lessons learned:

- I initially hooked Whisper as the Speech To Text model assuming that it would be the best option as I have been hearing about it A LOT. Unfortunately, inherint property of Whisper make it ill suited for the task at hand. Whisper models are trained using massive unsupervised amount of data. Most of these data come from internet videos with subtitles. Because it was trained on this kind of data, it learned to chop text based on the visual constraints of a screen and acoustic pauses, rather than grammatical boundaries. [1]
I also discovered that whisper models are notoriously weak at timestamping the sentence they transcribe.
Even tough it is not particularly visible in this specific output video, having timestamps which are not perfectly aligned often resulted in chopped words. Also, as a consequence of the shortcomings already described, the speech to text would sometimes split a single logical sentence in two parts if the speaker took a breath mid sentence of paused for enphasis.
Then the video editor model would sometimes judge only one half of the sentence as useful creating the perfect recipe for non sensical gibberish. :(
Solution: Part of the weak points of Whisper should be solved by using WhisperX [2] which integrate Whisper in a longer pipeline and results in better timestamping and sentence splitting. Because it did not integrate easily with the stack I decided to use and it seemed a bit tricky to set up I opted for [Vosk](https://alphacephei.com/vosk/) I had never heard about them before but their model produced output that is qualitatively similar to Whisper while it uses Acustic Alignment for pixel perfect timestamping and Voice Activity Detection to split the sentences in a reasonable way.

- Loss-in-the-middle still exists even on 2026 models. _Lost in the Middle: How Language Models Use Long Contexts_[3] is a paper from 2024 which takes the 2024 SOTA and discovers that the models oversample the beginning and the end of their context window and are less efficient on retrieving informations from the middle of their context window. I am sure that what this paper formally prove will not surprise the OG ChatGPT 3.5 users which in one way or another already empirically discovered that at some point.
Nevertheless, 2024 is a different geological era in comparison to 2024 and this defect became much less noticeable as models became better and could juggle longer context windows. Still, this problem remains. As it is explain in detail in [3], loss-in-the-middle is also an inherint characteristic of transformer architectures and it does not look like it can be completely fixed, only mitigated.
It is also difficult to report on more recent literature on this topic. LLMs are not a moving target, are a running target and every finding we achieve might be obsolete the moment a new model generation comes out.
The most recent literature I could find on the topic comes from [4] where appendix F is entirely dedicated to measuring this on the SOTA of May 2025. I scientifically bring a citation on this, but, I can empirically say that the problem is still here and kicking, at least with DeepSeek V4 flash. This resulted in the editor agent always oversampling the introduction or the end of the video.
This is partially because often, the creator makes a short resume of the content at the beginning of the video. So the LLM, which by design oversample that part, easily decides that the introductory summary is everything the user needs to know.
In reality is actually the opposite. The initial summary often brings very little value and the middel is the juicy part which the user is interested to.
Solution: Modify the architecture to add one more pass in which the agent just receives the whole transcript and it is tasked with finding the core message from the transcript. Then passes that along to the editor and to the reviewer in the format of [core message] + [full transcript] + [core message]. I had this idea after reding [3] and I had 0 expectation for it to work but, empirically, the results started being much better after this little tweak.

- The reviewer agent act as a rubberstamper. It basically always approve the finding of the editor. I expected the reviewer and the editor to iterate untill finding a good solution, but, as it turns out. "LLMs’ inherent sycophancy can collapse debates into premature consensus, potentially undermining the benefits of multi-agent debate [...] sycophancy is a core failure mode that amplifies disagreement collapse before reaching a correct conclusion in multi-agent debates, yields lower accuracy than single-agent baselines, and arises from distinct debater-driven and judge-driven failure modes" [5].
Or, in other words: "When evaluator error is coupled with generator error, self-evaluation becomes non-identifying: agreement provides negligible evidence of correctness." [6]
This is a rabbit hole on it's own! It could use it's own blog post.
Solution: Make the reviewer agent use a different model family than the editor agent. Basically, the bias of one model are just compounded if it is asked to judge the output of another instance of himself. When the models are different, the bias balance out. I reliabiliy started seeing the review iteration to go up to 1 or 2 iteration after this change.

### Reworked architecture

Beaten up but not defeated, this is the resulting architecture after the changes discussed.

graph LR
    A[Initial Video] --> B[Transcription]
    B --> C[Topic Agent]
    C --> D[Editor Agent]
    D --> E[Reviewer Agent]
    E -- Not Good --> D
    E -- Good --> F[Video Editing]
    F --> G[Final Video]

And this is the resulting video:

<iframe width="560" height="315" src="https://www.youtube.com/embed/tPcOFvEk_qs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe><div style="display: flex; gap: 20px;">
  <div style="flex: 1;">
    <h3>Original</h3>
    <iframe width="100%" height="315" src="https://www.youtube.com/embed/tvL4FF2lMnw" frameborder="0" allowfullscreen></iframe>
  </div>
  <div style="flex: 1;">
    <h3>First Iteration Version</h3>
    <iframe width="100%" height="315" src="https://www.youtube.com/embed/" frameborder="0" allowfullscreen></iframe>
  </div>
</div>

This one is much better and does a great job at preserving the main narrative.


[1] https://arxiv.org/pdf/2212.04356
[2] https://arxiv.org/abs/2303.00747
[3] https://arxiv.org/pdf/2307.03172
[4] https://arxiv.org/pdf/2505.
[5] https://arxiv.org/pdf/2509.23055
[6] https://www.techrxiv.org/doi/full/10.36227/techrxiv.176834656.66652387/v2