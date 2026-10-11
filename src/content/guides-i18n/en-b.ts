import type { LocalizedGuideMap } from "./types";

export const EN_B: LocalizedGuideMap = {
  "finish-first-draft": {
    slug: "finish-first-draft",
    title: "How to Finish a First Draft: A Strategy for Going the Distance Without Editing",
    description:
      "The most common reason people never finish a draft is the habit of endlessly fixing the opening. Concrete rules for the drafting stage and tricks for when you get stuck.",
    category: "집필 습관",
    summary: [
      "The goal of a first draft is not a good piece of writing but one that reaches the end.",
      "When a scene stalls, leave a one-line summary and move on.",
      "Draft and revise on different days, at different times.",
    ],
    related: ["revision-five-passes", "plot-stuck-questions", "slump-types"],
    sections: [
      {
        heading: "Why people never finish their drafts",
        paragraphs: [
          "As you write, you start to dislike the opening and go back to fix it. Once you start, you polish the first scene dozens of times and never write a single line of what comes after. This is the most common pattern behind unfinished drafts.",
          "The cause is trying to draft and revise at the same time. The eyes of the person writing and the eyes of the person editing are different, and switching between them back and forth slows your writing down dramatically.",
        ],
      },
      {
        heading: "Five rules for the drafting stage",
        steps: [
          "Don't reread earlier scenes. Read only yesterday's last paragraph and keep going.",
          "When a sentence feels awkward, leave a note in [ ] and move on. Example: [add description here]",
          "If you can't remember a name, place or date, use a placeholder (XXX) and keep writing.",
          "When you're stuck on a scene, write a one-line summary such as \"the two of them have a big fight here\" and go on to the next scene.",
          "Don't go back to the beginning until you've reached your target word count.",
        ],
      },
      {
        heading: "Build a system of note markers",
        paragraphs: [
          "To find the places you'll fix later, it helps to decide how to mark them. If you use the same symbols everywhere, a single search during revision will find every note.",
        ],
        example: {
          title: "Example note markers",
          lines: [
            "[expand] a place that needs more description or explanation",
            "[check] a place where a fact or a setting detail needs checking",
            "[dialogue] a place where the dialogue is awkward and needs rewriting",
            "[cut?] a sentence or scene that seems unnecessary",
            "XXX a place where a name or proper noun hasn't been decided",
          ],
        },
      },
      {
        heading: "Break the word count into pieces",
        paragraphs: [
          "Writing a story of 100,000 characters feels overwhelming, but writing 1,500 characters a day for two months feels doable. Divide the total length into daily amounts, make a checklist by scene, and tick off each scene as you finish it. Visible progress is a strong motivator.",
        ],
      },
      {
        heading: "When your draft feels terrible",
        paragraphs: [
          "It is normal for a draft to be terrible. Readers of finished works only see the result after revision, so it is easy to assume the first draft was just as smooth. In fact, many writers say the goal of a first draft is simply to get it written.",
          "When you don't like your draft, there is one thing to tell yourself: \"Now is the time for writing. Fixing comes later.\" If you don't waver on that distinction, your speed changes.",
        ],
      },
      {
        heading: "Rest after finishing the draft",
        paragraphs: [
          "When you finish a draft, don't dive straight into revision. Rest for at least a day, two if you can. With time you can see the text as if someone else wrote it, and the quality of the problems you find in revision changes.",
        ],
      },
      {
        heading: "Try it yourself: a plan to finish a draft this week",
        paragraphs: [
          "FAQ: I dislike the opening so much that I don't want to write. Fix the opening after the draft is finished. For now, just confirm that the story gets to the end. When you feel the urge to fix the beginning, move it into a note and keep going.",
        ],
        steps: [
          "Decide the total length and deadline for your draft.",
          "Divide the total by the number of remaining work days to get a daily amount.",
          "Make a length table by scene and tick off each scene as you finish it.",
          "Choose your note markers ([expand], [check], etc.) and write them at the top of the document.",
        ],
      },
    ],
  },

  "revision-five-passes": {
    slug: "revision-five-passes",
    title: "A Five-Pass Revision Checklist: Fix the Big Things Before the Small Ones",
    description:
      "Starting revision with sentence polishing leads to wasted effort. A five-pass method — structure, characters, scenes, sentences, proofreading — with checkpoints for each pass.",
    category: "집필 습관",
    summary: [
      "Work from the big units (structure) down to the small ones (spelling).",
      "Don't mix the passes. Look for only one kind of problem at a time.",
      "Leave at least a day between passes.",
    ],
    related: ["finish-first-draft", "dialogue", "scene-description"],
    sections: [
      {
        heading: "What happens when you fix sentences first",
        paragraphs: [
          "Many people finish a draft and start polishing from the first sentence. But if you later fix the structure and have to cut that scene entirely, the time you spent polishing its sentences disappears. Revision is more efficient when you go from big problems down to small ones.",
          "Try the five passes below in order. It matters to decide that each pass looks for only one kind of problem. Even if you notice a structural problem while reading sentences, just leave a note and deal with it in that pass.",
        ],
      },
      {
        heading: "Pass 1. Structure",
        paragraphs: [
          "Summarize the whole work one line per scene to make a list. Looking only at the list, check the following.",
        ],
        bullets: [
          "Does the story still hold together without this scene? (If so, it's a candidate for cutting.)",
          "Is there a scene that would create more tension if the order were changed?",
          "Is there a missing scene, such as a character's decision or the trigger for a conflict?",
          "Are the turning points in the right places?",
        ],
      },
      {
        heading: "Pass 2. Characters and settings",
        bullets: [
          "Are each character's speech and behavior consistent from start to finish?",
          "Is the reason a character changes shown clearly enough?",
          "Have the seeds you planted earlier paid off?",
          "Are there contradictions in settings such as time, place and age?",
        ],
      },
      {
        heading: "Pass 3. Scenes",
        paragraphs: [
          "Write the purpose of each scene in one sentence. A scene whose purpose is hard to state is a scene with a problem. If a scene only delivers information, add a line of conflict or emotion. If the same feeling repeats, see whether you can merge scenes into one.",
        ],
      },
      {
        heading: "Pass 4. Sentences",
        paragraphs: ["Now polish the sentences. Reading aloud lets your ears catch what sounds awkward."],
        bullets: [
          "Places where the same sentence pattern or ending repeats three or more times",
          "Sentences so long you run out of breath",
          "Expressions that drain force, such as \"it was the case that...\" or \"it could be said that...\"",
          "Repeated words with overlapping meaning (for example, \"advance warning\" or \"revert back\")",
        ],
      },
      {
        heading: "Pass 5. Proofreading",
        paragraphs: [
          "Finally, check spelling, spacing and punctuation, typos and how character names are written. Run a spell checker once, then check by hand the proper nouns and homophones it misses. It is more efficient to do this pass once the text is nearly final.",
        ],
      },
      {
        heading: "Rest between passes",
        paragraphs: [
          "I recommend leaving about a day between passes. Distance from the text brings you closer to the eyes of a first-time reader. If a deadline leaves no room to rest, slip in even a short break such as a walk or a meal between passes. If you keep looking at the same screen, your eyes keep missing the same errors.",
        ],
      },
      {
        heading: "Try it yourself: practice the five passes on one episode",
        paragraphs: [
          "At first, doing all five passes takes a long time. Until you get used to it, try keeping at least pass 1 and pass 4. Just the habit of looking at structure first changes how efficient your revision is.",
        ],
        steps: [
          "Pick an episode you've already written, make a one-line summary of each scene and see whether any scene can be cut (Pass 1).",
          "Mark whether each character's speech and behavior is consistent (Pass 2).",
          "Write the purpose of each scene in one sentence (Pass 3).",
          "Read aloud and fix awkward sentences (Pass 4).",
          "Finally, run a spell check (Pass 5). Leave at least a few hours between passes.",
        ],
      },
    ],
  },

  "word-count-tracking": {
    slug: "word-count-tracking",
    title: "Making Word-Count Tracking a Source of Motivation: Goals and Recording Habits",
    description:
      "How to make recording your word count motivating rather than stressful: choosing what to track, setting goals, reading the graph, and what to do when tracking becomes stressful.",
    category: "집필 습관",
    summary: [
      "Use records not as a grade but as data that shows your own patterns.",
      "Don't look at word count alone. Look at time, streak days and progress per work together.",
      "Set two levels of goal: the minimum you can do on your worst day and a challenge goal for a good day.",
    ],
    related: ["find-your-writing-time", "daily-writing-routine", "serial-buffer-and-schedule"],
    sections: [
      {
        heading: "Why tracking helps, and why it's risky",
        paragraphs: [
          "Recording your daily output makes vague progress visible. \"I feel like I haven't written much lately\" and \"I actually wrote 40% less than last week\" are completely different pieces of information. Numbers reduce the distortion that feelings create.",
          "On the other hand, tracking can become too much pressure. If you start comparing yourself with others or feel compelled to raise the number every day, you end up clinging to quantity over quality. This article covers how to use tracking productively while reducing the pressure.",
        ],
      },
      {
        heading: "What to track: four measures",
        paragraphs: [
          "If you record only quantity, days spent revising or researching show up as \"0\" and feel empty. Adding a time measure lets you see accomplishment even on revision days.",
        ],
        bullets: [
          "Quantity: the number of characters written that day (cuts or pages for webtoons). The most basic measure",
          "Time: how long you actually focused (number of Pomodoro sets). If time added up even when quantity is low, you did work",
          "Streak days: how many days in a row you worked. A sign that a habit is forming",
          "Progress per work: how far you are relative to the whole plan. The most important measure for staying motivated in a long serial",
        ],
      },
      {
        heading: "Set goals in two levels",
        paragraphs: [
          "If you have only one goal, a day you miss it becomes a failure. Splitting it into two levels lightens the load. Set the minimum goal at a level you can reach even on your worst day, and the challenge goal at the level of a good day. Make a rule that meeting only the minimum goal counts as a success for that day.",
        ],
        example: {
          title: "Example goals (web novel, per day)",
          lines: [
            "Minimum goal: 1,000 characters or 2 Pomodoro sets → meeting it means \"today was a success\"",
            "Normal goal: 2,500 characters",
            "Challenge goal: 4,000 characters or more (record it as a bonus if you hit it)",
            "Revision and brainstorming days: instead of word count, record the number of sets and one line about what you did",
          ],
        },
      },
      {
        heading: "How to read the graph",
        paragraphs: [
          "Don't swing with the ups and downs of a single day. Look at weekly averages. A day's output changes a lot with the day of the week, your condition and your schedule, but over a week the trend shows.",
        ],
        steps: [
          "Compare weekly totals over about four weeks to see whether the trend is rising or falling.",
          "For a week when output dropped sharply, look at what happened along with your notes (a deadline, a move, a cold, etc.).",
          "Work out the average by day of the week to find the days you write well and the days you don't.",
          "Find what days where your streak broke have in common, and prepare for those obstacles in advance.",
        ],
      },
      {
        heading: "How to record: the least annoying way",
        paragraphs: [
          "For a tracking habit to last, it must not be a hassle. Pick one tool you can enter into right after you finish working. If you record in several places, one is likely to get missed. A paper notebook, a spreadsheet or a service all work. If entering takes more than ten seconds, cut down the measures.",
          "If you use an environment like an online studio where your writing tools and records are in one place, you can leave your numbers right after focusing, so you skip recording less often.",
        ],
      },
      {
        heading: "When comparison gets hard",
        bullets: [
          "When you see someone else's numbers, remember you don't know what kind of work they did (a draft or a revision) or what their situation is",
          "Change your standard of comparison to \"me yesterday\" or \"me last month\"",
          "If rankings become stressful, you can stop looking at them for a while. Records are just a tool for you",
          "If there are days you didn't record, leave them blank and move on. Don't try to fill in days that have passed",
        ],
      },
      {
        heading: "Look back at the numbers once a month",
        paragraphs: [
          "At the end of the month, write down the month's total, the average, your longest streak, and the day you wrote the most and why. If you also write \"the best decision I made this month,\" your records become learning material rather than self-judgment. Records built up this way are the most reliable basis when you change your publishing schedule or plan a new work.",
        ],
      },
    ],
  },

  "stop-procrastinating": {
    slug: "stop-procrastinating",
    title: "When You Keep Putting Off Writing: Ten Ways to Lower the Barrier to Starting",
    description:
      "Procrastination is often not laziness but the burden of starting. Separate the causes of difficulty starting and learn ten concrete ways to make starting easier.",
    category: "집필 습관",
    summary: [
      "Procrastination is often not a character flaw but avoidance caused by the discomfort of starting.",
      "Separating the cause (overwhelm, perfectionism, fatigue, anxiety) changes the remedy.",
      "Rather than gritting your teeth, build an environment and rules that lower the barrier to starting.",
    ],
    related: ["pomodoro-for-writers", "slump-types", "finish-first-draft"],
    sections: [
      {
        heading: "A misunderstanding about procrastination",
        paragraphs: [
          "Many writers blame themselves for putting off writing, thinking \"I have weak willpower.\" But procrastination is mostly not about not wanting to do it. It is behavior to avoid the discomfort of starting. You do something else because you think you'll write badly right now, you don't know where to begin, or you'd feel bad if you write something and dislike it.",
          "Seen this way, the fix for procrastination is not training willpower but making starting less uncomfortable. This article explains methods by cause.",
        ],
      },
      {
        heading: "Separate the cause first",
        paragraphs: [
          "Often several causes overlap. Pick the one or two biggest and try the matching methods below first.",
        ],
        bullets: [
          "Overwhelm: you put it off because you don't know what to write first. The unit of work is too big",
          "Perfectionism: you don't start unless you're confident you can write well. Your standard for the result is too high",
          "Fatigue: your body and mind are worn out and you have no energy to start",
          "Anxiety: you're afraid of the work or of being judged, so opening the work feels scary",
          "Temptation from other things: easier activities with instant rewards (social media, videos) are right in front of you",
        ],
      },
      {
        heading: "When overwhelm is the cause",
        steps: [
          "Break the work into the smallest unit. Change \"write episode 1\" to \"write the first paragraph of the first scene.\"",
          "At the end of the day, leave a one-line note about the next scene. That way you already know what to write when you sit down in the morning.",
          "Set a 10-minute timer and decide only that you will definitely write during that time. After 10 minutes you may stop.",
        ],
      },
      {
        heading: "When perfectionism is the cause",
        paragraphs: [
          "The problem with perfectionism is not a high standard but applying that standard even to the starting stage. Apply draft standards to the draft and revision standards to revision.",
        ],
        steps: [
          "Set the goal of your draft as \"writing something bad.\" Give yourself permission to write it deliberately messy.",
          "Try a rule of not using the delete key while you write. Fixing is a job for after the writing is done.",
          "Don't decide who will see it. Write first in a document only you will see.",
        ],
      },
      {
        heading: "When fatigue and anxiety are the cause",
        paragraphs: [
          "If fatigue is the cause, rest is the answer. Check the basics first: sleep, meals and exercise. On tired days, make \"sit for 15 minutes\" the goal, and you don't have to do more.",
          "If anxiety is the cause, even opening the work is a burden. In that case, start not with the work file but by writing down your thoughts about the day for three minutes in a blank document. Once your body is used to the act of writing, it is easier to move on to the main work. If anxiety lasts and affects your daily life, getting professional help is also a good choice.",
        ],
      },
      {
        heading: "Solving it through your environment",
        bullets: [
          "Put your phone in another room before you begin, or use a lock app",
          "Set your working document to open automatically when you turn on the computer. Remove the step of finding the file",
          "Use a place that turns on work mode, such as a cafe, a library or an online studio",
          "Create a starting ritual (the same music, the same drink, the same seat)",
          "Match your start time with other people who are working at the same time",
        ],
      },
      {
        heading: "The first five minutes are the hardest",
        paragraphs: [
          "For most people the hardest time is the first few minutes after starting. Once you get past that stretch, getting into flow is easy. That is why the \"just try five minutes\" approach works. You may quit after five minutes, but in practice you usually keep going. The fact that quitting is an option makes starting easier.",
        ],
      },
      {
        heading: "What to do about a day you put it off",
        paragraphs: [
          "If you put off a day, don't try to overdo it the next day to catch up. Returning to your usual amount comes first. Self-blame makes the next day's start harder. One sentence is enough: \"I rested yesterday and started again today.\"",
        ],
      },
    ],
  },
};
