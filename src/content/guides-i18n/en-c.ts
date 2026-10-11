import type { LocalizedGuideMap } from "./types";

export const EN_C: LocalizedGuideMap = {
  "weekly-writing-plan": {
    slug: "weekly-writing-plan",
    title: "Making a Weekly Writing Plan: How to Manage a Serial in One-Week Units",
    description:
      "Planning only by the day falls apart easily. How to schedule brainstorming, drafting, revising and rest across a week, a weekly check-in sheet, and how to adjust when your schedule slips.",
    category: "집필 습관",
    summary: [
      "Planning by the week leaves room to make up for a day that goes wrong.",
      "Fit brainstorming, drafting, revising and rest all into one week.",
      "Keep the weekly plan simple: three must-do items and some slack time.",
    ],
    related: ["daily-writing-routine", "serial-buffer-and-schedule", "word-count-tracking"],
    sections: [
      {
        heading: "Why daily plans keep falling apart",
        paragraphs: [
          "A plan made one day at a time collapses as soon as a variable appears. A sudden appointment, a bad day, or one task that takes longer than expected throws off the whole plan. When one day goes wrong you think \"today is ruined,\" and the next day is affected too.",
          "If you plan by the week, you can make up for a bad day on another day. It also fits work like a serial, where deadlines come around weekly.",
        ],
      },
      {
        heading: "The basic structure of a weekly plan",
        paragraphs: [
          "First divide the kinds of work you need in a week: drafting new writing, revising what you wrote, brainstorming the next story, and rest. All four need to fit inside one week for the serial to keep cycling.",
        ],
        example: {
          title: "A week for a writer with a weekly serial",
          lines: [
            "Mon: brainstorming (outline next episode's scenes, research) + one light drafting set",
            "Tue–Wed: focused drafting (2–3 sets a day)",
            "Thu: finish the draft + a day off to get distance from the text",
            "Fri: revision passes 1 and 2 (structure and characters)",
            "Sat: revision passes 3 and 4 (scenes and sentences), prepare to upload",
            "Sun: complete rest. If your release day is Sunday, move it to Monday",
          ],
        },
      },
      {
        heading: "Choose just three must-do items",
        paragraphs: [
          "If you write ten items on a weekly plan, it is hard to follow. Pick just three things you must finish this week. Finishing only those three makes this week a success. Everything else is a bonus for when you have room.",
        ],
        bullets: [
          "Examples: \"Finish the draft of episode 3,\" \"Finish revising episode 2,\" \"Write a first pass of the contest synopsis\"",
          "Write a completion criterion for each item (for \"finish the draft,\" state exactly how many characters)",
          "If you go beyond three, re-rank your priorities",
        ],
      },
      {
        heading: "Build slack time into the plan",
        paragraphs: [
          "A big reason plans don't hold is that every hour is filled with work. Unexpected variables always find their way into a schedule. Deliberately leave one day a week, or an hour or two a day, empty. This buffer time protects the entire plan.",
          "If nothing happened during the buffer, you can use that time to rest or to brainstorm for next week. Remember that empty time is not waste but a safety device.",
        ],
      },
      {
        heading: "Set aside a weekly check-in",
        paragraphs: [
          "Once a week, spend about ten minutes comparing the plan with the results. Sunday evening or Monday morning works well. A check-in is not self-criticism but information gathering to adjust next week's plan.",
        ],
        steps: [
          "Check how many of last week's three must-do items you finished.",
          "For anything unfinished, write the reason in one line (not enough time, condition, a bigger task than expected, etc.).",
          "Check your buffer of finished episodes for this week.",
          "Decide next week's three must-do items and the time to leave free in your schedule.",
        ],
      },
      {
        heading: "How to adjust when your schedule slips",
        bullets: [
          "If a whole day is lost, cross out the least important item from this week's goals. Don't try to make up for everything",
          "If your release day is at risk, compress the revision passes but don't skip pass 1 (structure)",
          "If you need a hiatus, announce it early. The earlier you announce, the better for readers too",
          "If the same cause keeps knocking you off, adjust your release cycle or length rather than your planning method",
        ],
      },
      {
        heading: "The simpler the planning tool, the better",
        paragraphs: [
          "Rather than a complicated planning app or a fancy diary, the best tool is the one you pick up most often. A single sheet of paper with a box for each weekday and \"three must-dos this week\" is enough. Don't let time spent decorating your tools cut into your actual working time.",
        ],
      },
    ],
  },

  "first-episode": {
    slug: "first-episode",
    title: "How to Write Episode 1 of a Web Novel: Structure It Around a Hook, a Character and Conflict",
    description:
      "Episode 1 decides whether a reader keeps going. Rather than clinging to explaining the setting, this covers the order for building in a first-scene hook, the protagonist's desire and the seed of conflict.",
    category: "웹소설 작법",
    summary: [
      "Episode 1 doesn't need the whole world. It needs three things: curiosity, a character's desire and an obstacle.",
      "Dissolve the setting into actions and events and reveal it bit by bit.",
      "End the final paragraph with a question or event that makes the reader tap the next episode.",
    ],
    related: ["character-desire", "plot-stuck-questions", "serial-buffer-and-schedule"],
    sections: [
      {
        heading: "Why episode 1 is hard",
        paragraphs: [
          "Episode 1 seems to have too much to do. You have to introduce the protagonist, explain the world, start the plot and show appeal. As a result the setting explanation gets long and you end up with an episode where the story never begins.",
          "Readers don't come to episode 1 to understand your world. They come to judge whether the story will be fun. You only need to include precisely the ingredients for that judgment.",
        ],
      },
      {
        heading: "The hook: pose a question in the first scene",
        paragraphs: [
          "A hook is a device that makes readers wonder \"Why?\" and \"What happens next?\" It doesn't have to be a sensational event. Showing the result of something that has already happened, having the protagonist do something strange, or a small crack in an ordinary day is enough.",
        ],
        example: {
          title: "Example hook lines (posing a question instead of explaining the setting)",
          lines: [
            "Weak hook: \"In this world, abilities appear at sixteen. The protagonist Hayoon turned sixteen this year.\"",
            "Strong hook: \"On awakening day, no mark appeared on Hayoon's palm. And only the instructor on the stage noticed.\"",
            "The second delivers the setting too, while leaving the question \"Why did the instructor notice?\"",
          ],
        },
      },
      {
        heading: "Character: show what the protagonist wants through action",
        paragraphs: [
          "Readers need to know what the protagonist wants to root for them. Showing Hayoon secretly staying behind to practice in the training hall the night before the exam is far stronger than explaining \"Hayoon wanted recognition.\"",
          "Also, don't fill the protagonist's personality with strengths alone. Small flaws and habits make a character feel three-dimensional.",
        ],
      },
      {
        heading: "Conflict: show the obstacle to the desire",
        paragraphs: [
          "By the end of episode 1, readers need to know what this person wants and what is blocking them. The obstacle can be a villain, the protagonist's inner fear, or the environment they're given.",
        ],
        steps: [
          "Briefly show the protagonist's everyday life or state at the start (within about 20% of the length).",
          "An event occurs that shakes that everyday life.",
          "The protagonist reacts to the event and makes a choice.",
          "That choice creates a bigger problem.",
        ],
      },
      {
        heading: "Spread out the setting explanation",
        paragraphs: [
          "The richer a work's worldbuilding, the more you want to put all of it into episode 1. But setting is understood only when readers receive it at the moment they need it and only as much as they need. If you reveal the rules one at a time as the character solves problems, the explanation dissolves into the story.",
          "I recommend picking just three things from your setting notes that are absolutely required in episode 1 and spreading the rest across episodes 2 to 5.",
        ],
      },
      {
        heading: "The last paragraph is the link to the next episode",
        paragraphs: [
          "On a serial platform, what matters is whether a reader who finished episode 1 taps episode 2 right away. In the last paragraph, leave one of these: a new event, a twist, a moment of choice, or an unresolved question. Leaving things open is better than closing the story neatly.",
          "Read your finished episode 1 aloud and check whether the first three sentences would catch a reader's interest. If you can, read it to someone who doesn't know the work and ask directly whether they wanted to know what comes next.",
        ],
      },
      {
        heading: "Try it yourself: my episode 1 checklist",
        paragraphs: [
          "FAQ: Should I include a prologue in episode 1? A prologue becomes a threshold before readers enter the main story. Unless the information is essential, it is safer to start episode 1 with the hook in the main text.",
        ],
        steps: [
          "Write out your first three sentences separately and judge for yourself whether a reader who doesn't know the work would want to know what comes next.",
          "Find whether episode 1 contains an action that shows what the protagonist wants.",
          "Mark any place where setting explanation runs a paragraph or more, and see whether you can split it into scenes or dialogue.",
          "Check whether the last paragraph makes the reader want to tap the next episode.",
        ],
      },
    ],
  },

  "character-desire": {
    slug: "character-desire",
    title: "Creating Living Characters: Adding Depth Through Desire, Lack and Voice",
    description:
      "If you've been told your characters are flat, start by checking their desire and lack. How to make a character sheet, how to tell voices apart, and how to show characters through action.",
    category: "웹소설 작법",
    summary: [
      "The core of a character is not appearance or ability but what they want and what they lack.",
      "A character looks three-dimensional when their outward desire and inner desire differ.",
      "If you set distinct speech and habits, readers can tell who is speaking even with the names covered.",
    ],
    related: ["dialogue", "first-episode", "plot-stuck-questions"],
    sections: [
      {
        heading: "A list of settings is not a character",
        paragraphs: [
          "Even with a character sheet packed with height, hair color, job, hobbies and favorite food, a character may not feel alive. Settings are information, and a character is someone who makes choices. The moment readers respond to a character is when that character makes a hard choice.",
          "So when you create a character, decide before appearance: what does this character want, and what stands in the way?",
        ],
      },
      {
        heading: "Deciding desire and lack",
        paragraphs: [
          "Desire is the goal a character wants to achieve in the story. Lack is what the character is missing, the inner weakness they want to avoid. When the two collide, they become conflict.",
        ],
        example: {
          title: "Character core sheet (five lines per character is enough)",
          lines: [
            "What they want on the surface: to place first in the guild exam",
            "What they truly want: to be certain that no one will abandon them",
            "What they fear most: having their lack of skill exposed",
            "What they do because of it: hide their weakness, refuse to ask for help and overwork alone",
            "How they need to change in the story: learn to accept help",
          ],
        },
      },
      {
        heading: "How to show a character through action",
        bullets: [
          "Instead of writing \"He was honest,\" write a scene where he goes back to return extra change he was given",
          "Decide on one small habit, such as fiddling with a sleeve when nervous or looking away when lying",
          "Show priorities through what the protagonist gives up when facing a difficult choice",
          "Show reputation and relationships through how the people around the protagonist treat them",
        ],
      },
      {
        heading: "Telling voices apart",
        paragraphs: [
          "When several characters appear, it's easy for all of them to speak in a similar voice. A good test is whether you can tell who is speaking when you cover the name before the line.",
        ],
        steps: [
          "Sentence length: a character who speaks in short bursts vs. one who explains at length",
          "Register: a formal character, one who mixes in casual speech, one who trails off at the end of sentences",
          "Give each a favorite word or verbal tic (use it only occasionally, since too much repetition becomes tiresome)",
          "Decide how they change when emotions run high (do they speak faster, or go quiet?)",
        ],
      },
      {
        heading: "Supporting characters want one thing too",
        paragraphs: [
          "A supporting character who only helps the protagonist easily feels like a tool. If each one also wants something in the story, characters collide in every scene and the dialogue comes alive. For example, if the protagonist's friend cheers them on while also aiming for the same position, there is tension in their conversations.",
        ],
      },
      {
        heading: "Designing how a character changes",
        paragraphs: [
          "If the protagonist is the same person at the end as at the start, readers feel empty. Change doesn't come suddenly. It builds up little by little through big and small events. Place one choice in the early, middle and late parts that this character wouldn't have made before.",
        ],
      },
      {
        heading: "Try it yourself: fill out one character core sheet",
        paragraphs: [
          "If you get stuck on a field while filling out the sheet, that's a part of the character you haven't decided yet. Rather than forcing it, try writing one scene where the character makes a difficult choice, and the answer may appear.",
        ],
        steps: [
          "Write the protagonist's \"what they want on the surface\" and \"what they truly want\" in one line each.",
          "Write what they fear most and what they do because of it.",
          "Write in one line how they need to change in this story.",
          "Fill out the same sheet for one supporting character and look for where they collide with the protagonist.",
        ],
      },
    ],
  },

  "chapter-endings": {
    slug: "chapter-endings",
    title: "Endings That Make Readers Tap the Next Episode: How to Write Cliffhangers",
    description:
      "In a serialized web novel, the last scene of an episode is the link to the next. Types of cliffhangers, how to write them, the problems of overusing them, and gentler endings for everyday episodes.",
    category: "웹소설 작법",
    summary: [
      "The end of an episode is the place to leave readers with the feeling \"I want to know what's next.\"",
      "Not only shocking events but also questions, choices and lingering emotion make good endings.",
      "Cutting off the same way every time tires readers, so vary your methods.",
    ],
    related: ["first-episode", "pacing-and-tension", "foreshadowing-payoff"],
    sections: [
      {
        heading: "Why endings matter",
        paragraphs: [
          "On a serial platform, the point where a reader decides whether to tap the next episode after finishing one is mostly the last scene. If the ending is loose, readers may think \"that's enough, I've read this far\" and leave. If curiosity remains at the end, they go looking for the next episode right away.",
          "A cliffhanger means cutting the story at a tense moment as if hanging off a cliff, but the endings actually used in serials are far more varied. This article sorts out several approaches.",
        ],
      },
      {
        heading: "Five types of endings",
        paragraphs: [
          "Choose the type that suits the work's mood and that episode's content. Forcing a crisis-type ending on an everyday episode only feels awkward.",
        ],
        bullets: [
          "Crisis: cut off at a moment when a character is in danger (the door opens and someone is standing there)",
          "Twist: reveal information at the end that overturns what the reader believed",
          "Question: pose an unresolved mystery (\"Why was there no name on that letter?\")",
          "Choice: cut off at the moment a character is about to make an important decision",
          "Lingering note: end on a moment when feeling deepens or a meaningful line, without a big event",
        ],
      },
      {
        heading: "The order for designing the last scene",
        steps: [
          "Decide what happens in the next episode first. An ending is a promise of the next episode.",
          "From that, pick the one piece of information or situation readers will be most curious about and put it in the last scene.",
          "In the lead-up to the last scene, raise the tension bit by bit (cut sentences short or compress time).",
          "Write the last sentence short and clear. End on an event or a question without adding explanation.",
        ],
        example: {
          title: "Example of fixing a last paragraph",
          lines: [
            "Before: \"Hayoon returned to her room and fell asleep thinking carefully about the day. What will happen tomorrow?\"",
            "After: \"Hayoon stopped as she was about to turn off the light. On the desk lay a letter that hadn't been there yesterday. The envelope bore her own name, in the handwriting of her dead mother.\"",
            "After the fix, a concrete event and a question remain, making the reader tap the next episode.",
          ],
        },
      },
      {
        heading: "Problems with overuse",
        paragraphs: [
          "If you end every episode on a shocking event, readers quickly notice the pattern and tire of it. And if you resolve the curiosity in a trivial way in the next episode, trust breaks. The question you posed at the end must be properly handled in the next episode.",
        ],
        bullets: [
          "Beware of trick endings: if you build a crisis and then resolve it in the next episode with \"it was all a dream,\" readers feel cheated",
          "Avoid repeating the same type: don't end three episodes in a row the same way",
          "Small knots are needed: after a big event, give one episode to sort out emotions to create breathing room",
        ],
      },
      {
        heading: "Endings for everyday and quiet episodes",
        paragraphs: [
          "Not every episode can be tense. Even in scenes where relationships deepen or in a resting stretch of the story, you can hold readers. In those cases, put something like this at the end: the moment a character hears the other person and changes, a line hinting at a secret not yet told, or a small unease about what's coming.",
        ],
        example: {
          title: "Examples of endings for quiet episodes",
          lines: [
            "Dialogue type: \"I'll tell you tomorrow. Tonight... just stay a little longer.\"",
            "Image type: The light leaking from beneath the closed door went out. Only the sound of two people's footsteps remained in the hallway.",
            "Hint type: She didn't know then. That goodbye would be the last.",
          ],
        },
      },
      {
        heading: "Checking endings during revision",
        steps: [
          "Read only the last three sentences on their own and judge for yourself whether you want to know what comes next.",
          "Write the last sentences of the past five episodes side by side and check whether a type is repeating.",
          "Check whether the last scene connects to the core event of that episode. An event unrelated to the episode that suddenly pops up feels awkward.",
          "Note in which episodes readers' comments said \"I want to know what's next,\" and use the pattern as a reference.",
        ],
      },
    ],
  },
};
