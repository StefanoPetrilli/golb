---
title: Notes on Parabolas
layout: post
permalink: /parabolas/
math: true
section: math
---

If we assume for a second constant gravity and zero air resistance, if when throwing a stone we
graph the position of the stone onver time in a carthesian graph where the x axis is the distance
and the y axis is the altitude, we would get something like this:

<div id="parabola-widget">
  <canvas id="parabola-canvas" width="when600" height="360" style="box-sizing: border-box; border: 6px solid #cbbec2; width: 100%; max-width: 600px;" aria-label="Interactive parabola plot"></canvas>
  <p>
    vertex x <input id="pw-h" type="number" step="any" value="2" style="width: 6em;">
    vertex y <input id="pw-k" type="number" step="any" value="4" style="width: 6em;">
    a <input id="pw-a" type="number" step="any" value="-1" style="width: 6em;">
  </p>
  <p id="pw-error"></p>
  <p>Canonical form: <span id="pw-canonical"></span></p>
  <p>Standard form: <span id="pw-standard"></span></p>
</div>
<script src="{{ '/assets/parabolas/parabola.js' | relative_url }}" defer></script>

Both the _standard form_ notation and the _canonical form_ represent the same parabola.

The standard form ($ax^2+bx+c=y$) is very convenient if we want to plug data into the notation
and plot the corresponding value.

We can infer A LOT from the constants when a parabola is written in the standard form:
- $a$: tells us both the direction and the vertical stretch of the parabola. If $a$ is negative,
the parabola will point downward, if it is positive, it will point upward. As $a$ approaches
0, the parabola stretches longer. If $a$ is 0, then it is not a parabola anymore but a straight line.
- $c$: is the y-intercept aka the point of the parabola which touches the y-axis.

The determinans ($\Delta$), taken by itself, tells us in how many points the parabola intersects
the x axis.
- $\Delta < 0$: There are no points where the parabola intersects the axis.
- $\Delta = 0$: There is only one point where the parabola intersects the axis.
- $\Delta > 0$: There are two points where the parabola intersects the axis.

The formual to calculate it is: 

$$\Delta = b^2-4ac$$

$k$ tells us the exact numerical y-coordinate of the turning point of the variable.
The consequence is that:
- $k > 0$: the turning point is above the x-axis
- $k = 0$: the turning point is on the x-axis
- $k < 0$: the turning point in below the x-axis

The formula to calculate it is

$$k = - \frac{\Delta}{4a}$$

$h$ tells us the exact numerical x-coordinate of the turning point.

$$h = -\frac{b}{2a}$$

<div id="parabola-cases">
  <div>
    <p>No real roots: $f(x) = -(x-2)^2 - 4$, $\Delta = -16$</p>
    <div style="display: flex; flex-wrap: wrap; gap: 1.5em; align-items: center;">
      <canvas id="case-0-parabola" width="600" height="360" style="box-sizing: border-box; border: 6px solid #cbbec2; flex: 1 1 280px; min-width: 0;" aria-label="Parabola with no real roots"></canvas>
      <canvas id="case-0-discriminant" width="600" height="360" style="box-sizing: border-box; border: 6px solid #cbbec2; flex: 1 1 280px; min-width: 0;" aria-label="Discriminant for no real roots"></canvas>
    </div>
  </div>
  <div>
    <p>One real root: $f(x) = -(x-2)^2$, $\Delta = 0$</p>
    <div style="display: flex; flex-wrap: wrap; gap: 1.5em; align-items: center;">
      <canvas id="case-1-parabola" width="600" height="360" style="box-sizing: border-box; border: 6px solid #cbbec2; flex: 1 1 280px; min-width: 0;" aria-label="Parabola with one real root"></canvas>
      <canvas id="case-1-discriminant" width="600" height="360" style="box-sizing: border-box; border: 6px solid #cbbec2; flex: 1 1 280px; min-width: 0;" aria-label="Discriminant for one real root"></canvas>
    </div>
  </div>
  <div>
    <p>Two real roots: $f(x) = -(x-2)^2 + 4$, $\Delta = 16$</p>
    <div style="display: flex; flex-wrap: wrap; gap: 1.5em; align-items: center;">
      <canvas id="case-2-parabola" width="600" height="360" style="box-sizing: border-box; border: 6px solid #cbbec2; flex: 1 1 280px; min-width: 0;" aria-label="Parabola with two real roots"></canvas>
      <canvas id="case-2-discriminant" width="600" height="360" style="box-sizing: border-box; border: 6px solid #cbbec2; flex: 1 1 280px; min-width: 0;" aria-label="Discriminant for two real roots"></canvas>
    </div>
  </div>
</div>

The canonical form of a parabola is:

$$ y = a(x-h)^2+k $$

The vertex is now $(h, k)$.

If the parabola has real roots $x_1$ and $x_2$, the vertex lies halfway between them:
$h = \frac{x_1 + x_2}{2}$, and $k = f(h)$.