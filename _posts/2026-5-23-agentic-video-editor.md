---
title: What I learned building a local Agentic video editor
layout: post
permalink: /agentic-video-editor/
---

YouTube has a minimum video length for mid-roll monetization of 8 minutes. A lot of the videos on the platform could convey the same message in 1 minute but they have to overly water down the message so that you can ultimately be fed with more advertisements. To keep the engagement high even while watering down the content, dark patterns, like cliffhangers and generating hype with fluff are used making it difficult to leave the video once started.

Within this incentive systems, conciseness is not rewarded. How would these videos look like if creators put respect for your time before metrics and money?

This is the question I had in mind when I decided to create an agentic video editor which takes a video and strips down all the fluff so you can just get the juice.

I figured that it would be an amazing weekend project to learn more on agentic workflows. I started this project with a naive understanding which gave birth to a naive architecture. As I kept experimenting and exploring, and it moved from a quick weekend project to a much longer project, my understanding and the workflow architecture evolved with it. I think it is interesting to walk through the changes, from the initial naive architecture to the current, more sophisticated one.

## Goal Setting

My main goal with this project was to get a better grip on agentic workflow and agentic harness trying to remove as much work as possible that is not related with that.
The idea is not to have a SaaS or a product of any kind so this is just going to take the video from a directory in the file system, run the workflow and save the output video on another directory.

Ideally, I wanted to run this pipeline only on small local models.

Finally, there are a lot of videos where the message being conveyed is strictly visual or where the message is actually already succint and no cut should be made. To relax the problem I will just assume that the video has a core message buried under a lot of fluff and that the message is strictly conveyed through the words.

Before starting I defined as my benchmark the bespoke video [How To Make 20 Cent Iced Coffee by Graham Stephan](https://www.youtube.com/watch?v=tvL4FF2lMnw). The original video is 13 minutes long. Out of these 13 minutes, only about 3 minutes are actually useful while the rest is fluff.


<iframe width="560" height="315" src="https://www.youtube.com/embed/tPcOFvEk_qs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe><div style="display: flex; gap: 20px;">
  <div style="flex: 1;">
    <h3>Original</h3>
    <iframe width="100%" height="315" src="https://www.youtube.com/embed/tvL4FF2lMnw" frameborder="0" allowfullscreen></iframe>
  </div>
  <div style="flex: 1;">
    <h3>I Respect your Time Version</h3>
    <iframe width="100%" height="315" src="https://www.youtube.com/embed/tPcOFvEk_qs" frameborder="0" allowfullscreen></iframe>
  </div>
</div>

I hand cutted the video myself. I will consider myself satisfied if my agentic pipeline can get to an output of simialr quality.

## Naive solution

The first naive solution which came to my mind is the following:

```mermaid
graph LR
    A[Initial Video] --> B[Transcription]
    B --> C[Editor Agent]
    C --> D[Reviewer Agent]
    D == Not Good ==> C
    D ==>|Good| E[Video Editing Agent]
    E --> F[final video]
```

I would take a video, run it trough a speech to text model to get the transcription, feed the full video transcript into an editor agent tasked with deciding what are the most important segments, then I would feed the selection to a Reviewer Agent which would be tasked to decide whether the selected sections of the video actually preserve the message.
In my plan, the editor agent and the reviewer agent would go back and fort untill the reviewer agent agrees with the selection made by the editor agent.
Finally the sections would be passed to a Video Editing Agent which knows how to use FFMpeg and takes care of generating the video with all the choosen parts.

It sounded easy and straight forward on paper but I was definitely not dealing with the messyness of reality.

The resulting video from running this piepeline is:

