# 0003 — The panel leads with a verdict, not with a score

Status: draft — answer the questions below in your own words, delete them, then
change this line to `accepted, <date>`.

> An ADR written by somebody else is worse than none: the first "why not the
> other way?" exposes it. Every question here is one you have already answered
> out loud; this file is where those answers stop being disposable.

## Context

- What did the top of the panel show before, and what was wrong with it?
- Who is the reader, and what question did they arrive with?
- Why is a number a poor answer to that question, even a well-calibrated one?

## Decision

- What does the panel show now? Two sentences at most.
- Where does the sentence come from — which field, on which check?

## Alternatives considered

- **A table from check id to wording, kept inside `verdict.ts`.** All the
  phrasing in one file is the obvious design. Why did you reject it? (What
  would adding a twelfth check have cost?)
- **Giving the verdict its own colour, independent of the score.** What could
  then appear on screen that cannot appear now?
- **Removing the score altogether.** It is the part you documented and tested
  most. Why keep it?
- **Letting any failing check lead the headline.** You tried this. What did the
  preview show you, and what number was next to what sentence?

## Consequences

- What did this cost? A number cannot be argued with; a sentence can.
- The wording now lives next to each check rather than in one place. What does
  that mean for whoever adds the next check?
- What is now guaranteed that was not guaranteed before? (Look at
  `isDecisive` in `src/core/verdict.ts` and say it in plain words.)
- Why did this decision force a change to the scoring model as well?

## Revisit when

- What would have to happen for this to turn out to be the wrong call?
