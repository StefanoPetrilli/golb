---
title: Notes on combinatorics
layout: post
permalink: /combinatorics/
math: true
---

Yesterday I was hanging out with a friend and we ended up talking about combinatorics.

Eventually he asked me to work out the formula to find all the permutations of $$n$$ unique objects. Perhaps
this is a reminiscence of the combinatorics class I had in the bachelor and perhaps this is the way
it is taught, but what came to my mind is a neat explanation:

If I have $$n$$ unique objects, I can imagine having $$n$$ spots. In the first spot, I can have any of the
$$n$$ elements. In the second spot, I can only pick one of the $$n - 1$$ remaining elements and so on till I
finish the spots and the elements.

This easily works out the formula:

$$\prod_{i=0}^{n-1} (n - i) = n!$$
