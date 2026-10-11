import type { LocalizedGuideMap } from "./types";

export const EN_D: LocalizedGuideMap = {
  "webtoon-pipeline-time": {
    slug: "webtoon-pipeline-time",
    title: "Budgeting Time for One Webtoon Episode: From Storyboard to Post-Editing",
    description:
      "The biggest variable in serializing a webtoon is how long one episode takes. How to record time by stage, find your bottleneck, and realistic ways to cut time.",
    category: "웹툰 작업",
    summary: [
      "First record how long each stage of an episode really takes, and find the bottleneck.",
      "The way to save time is not \"draw faster\" but \"draw less.\"",
      "Set your release cycle by working backward from the times you recorded.",
    ],
    related: ["webtoon-name-process", "body-care-habits", "serial-buffer-and-schedule"],
    sections: [
      {
        heading: "Why you should record your time",
        paragraphs: [
          "The biggest reason webtoon artists are chased by deadlines is that they don't know exactly how long an episode takes. You start by gut feeling, thinking \"two days should do it,\" and it keeps stretching to three or four.",
          "First, record the time for each stage while working on this episode. You can use a timer or a work-log app, or write start and end times on paper. After at least three episodes you will have an average.",
        ],
        example: {
          title: "Example time log for one episode (the numbers are examples and differ from person to person)",
          lines: [
            "Research and script: 3 hours",
            "Storyboard: 4 hours",
            "Line art: 12 hours",
            "Coloring: 10 hours",
            "Post-editing (effects, speech bubbles, lettering): 4 hours",
            "Total: 33 hours → if you can spend 20 hours a week, one episode takes about 1.7 weeks",
          ],
        },
      },
      {
        heading: "Finding the bottleneck",
        paragraphs: [
          "Looking at the log, the stage that takes longest stands out. The way to improve differs depending on whether line art or coloring takes longer. If one stage accounts for 40% or more of the total, that is your bottleneck. Cutting just 20% from one stage shrinks the total time considerably.",
        ],
      },
      {
        heading: "Saving time: draw less",
        bullets: [
          "Reduce the number of panels at the storyboard stage. One fewer panel cuts both line art and coloring time",
          "Draw a complicated background in detail once and build later panels around the characters",
          "Make frequently appearing backgrounds into reusable assets (within the limits of copyright)",
          "Duplicate crowds and repeated elements you've made once",
          "Save your frequently used effect lines and speech-bubble styles as presets and load them",
        ],
      },
      {
        heading: "Saving time: organize how you work",
        steps: [
          "Batch similar kinds of work. Finish all the line art for an episode in one go and then do all the coloring to cut the time lost switching tools.",
          "Put the hardest work (character expressions, panels where direction matters) in your most focused time of day.",
          "Work in blocks such as 50 minutes of work + 10 minutes of rest, and loosen your wrists and shoulders during the breaks.",
          "Organize your shortcuts and workspace. Even a few seconds saved on repeated actions adds up to a lot over an episode.",
        ],
      },
      {
        heading: "Calculating your release cycle and buffer",
        paragraphs: [
          "Using your recorded average, multiply by the working hours you have in a week. If one episode takes 33 hours and you can spend 25 hours a week, a weekly release is a stretch. In that case you need to release every two weeks, shorten each episode, or increase your working hours.",
          "Before you start a serial, I recommend building a buffer of at least three episodes. With a buffer, your release won't be interrupted if you suddenly get sick or something comes up.",
        ],
      },
      {
        heading: "Health and working speed",
        paragraphs: [
          "Working while seated for long hours builds fatigue in your shoulders, wrists and eyes, which slows your work in the long run. Cutting rest to save time often backfires. Include rest and stretching time in your work plan in advance.",
        ],
      },
      {
        heading: "Try it yourself: log the time for this episode",
        paragraphs: [
          "Records are most useful once you have about three episodes. One episode alone is heavily affected by chance, so record at least three in the same way.",
        ],
        steps: [
          "Get a timer or recording tool ready when you start working.",
          "Write down the time each time the stage changes (script, storyboard, line art, coloring, post-editing).",
          "When an episode is done, calculate the total per stage and the overall proportions.",
          "Choose one thing to cut from the stage with the biggest share (number of panels, backgrounds, effects) and apply it to the next episode.",
        ],
      },
    ],
  },

  "body-care-habits": {
    slug: "body-care-habits",
    title: "Body Care for Creators Who Sit for Long Hours: Eyes, Wrists, Back and Sleep",
    description:
      "General lifestyle habits to reduce the fatigue that builds from long hours of writing and drawing. Tips on when to rest while working, stretching, desk height and managing sleep.",
    category: "건강과 환경",
    summary: [
      "It works best to release fatigue in short, frequent breaks before it builds up.",
      "Rest your eyes every 20 minutes and your body every 50.",
      "If pain continues or gets worse, don't tough it out. See a medical professional.",
    ],
    related: ["workspace-setup", "webtoon-pipeline-time", "slump-types"],
    sections: [
      {
        heading: "Before you start",
        paragraphs: [
          "This article summarizes commonly known lifestyle habits to fit a working routine and is not a substitute for medical diagnosis or treatment. If symptoms such as numbness, severe pain or vision problems continue, see a medical professional.",
          "Writing and drawing mean holding the same posture for a long time. Fatigue in your muscles and eyes builds up slowly and then shows up all at once one day. Rather than dealing with symptoms after they appear, the habit of loosening up briefly during work so that fatigue doesn't build is far more effective.",
        ],
      },
      {
        heading: "Eyes: look far away every 20 minutes",
        paragraphs: [
          "Looking at a screen for a long time reduces blinking, leaving your eyes dry and tight. The \"20-20-20\" method is widely known: every 20 minutes, look at something about 6 meters (20 feet) away for 20 seconds. Looking at a distant view out the window is enough.",
        ],
        bullets: [
          "Set aside time to blink consciously on purpose",
          "Match screen brightness so it doesn't differ greatly from the brightness around you",
          "Place the screen at or slightly below eye level, about an arm's length from your eyes",
          "If dryness is severe, consider artificial tears or seeing an eye doctor",
        ],
      },
      {
        heading: "Wrists and hands: loosen repetitive motions",
        paragraphs: [
          "Typing and gripping a pen put repeated strain on your wrists and fingers. Slowly rolling your wrists before and after work and stretching your fingers out for five seconds each is enough to reduce stiffness.",
        ],
        steps: [
          "Slowly rotate your wrists clockwise and counterclockwise ten times each.",
          "Extend one arm forward and gently pull the fingers toward your body with the other hand, holding for 5 to 10 seconds.",
          "Make a fist and then spread your fingers wide, repeating ten times.",
          "Check that you're not gripping the pen too hard, and use a thicker pen or a grip if needed.",
        ],
      },
      {
        heading: "Neck, shoulders and back: stand up every 50 minutes",
        paragraphs: [
          "Sitting in one place for a long time makes your shoulders roll forward and your neck jut forward. After 50 minutes of work, stand up, walk and stretch. Even a brief change of posture greatly reduces fatigue.",
        ],
        example: {
          title: "One-minute stretches you can do at your desk",
          lines: [
            "Raise your clasped hands overhead and stretch up (10 seconds)",
            "Clasp your hands behind your back and open your chest (10 seconds)",
            "Slowly tilt your head to the left and right (10 seconds each)",
            "Stand up from the chair, tighten your glutes and straighten your back (10 seconds)",
          ],
        },
      },
      {
        heading: "Check your chair and desk height",
        bullets: [
          "Check that the soles of your feet rest comfortably on the floor and your knees are close to 90 degrees",
          "Adjust the desk or chair so your elbows rest comfortably at about 90 degrees",
          "Adjust the monitor so its top is at or slightly below eye level",
          "If you use a pen display, tilt it slightly to reduce how far you bend your neck",
        ],
      },
      {
        heading: "Sleep and deadlines",
        paragraphs: [
          "Sleep is the first thing sacrificed at deadline time, but lack of sleep directly reduces concentration and creativity. If you end up rewriting in revision what you produced during a few all-nighters, you come out behind. Secure a minimum sleep time in your schedule first, even during a deadline period.",
          "When you make a work schedule, plan by placing rest, meals and sleep first and fitting work into the remaining time, and you can sustain it for a long time.",
        ],
      },
      {
        heading: "Try it yourself: three body-care habits for this week",
        paragraphs: [
          "Habits last longer when you build them one at a time. If pain or numbness continues, see a medical professional before adjusting habits.",
        ],
        steps: [
          "Choose the easiest one to keep: looking far away every 20 minutes, standing up every 50, or rolling your wrists before work.",
          "Link that action to your timer alarm (for example, stand up and walk when a Pomodoro break begins).",
          "Mark the days you kept it on a calendar for a week.",
          "After a week, write one line on whether your eye and shoulder fatigue has changed, and add one more habit.",
        ],
      },
    ],
  },

  "workspace-setup": {
    slug: "workspace-setup",
    title: "Building a Workspace That Helps You Focus: Lighting, Noise and Desk Organization",
    description:
      "A workspace checklist for creators who work from home. Lighting and noise measures, tidying your desk, cutting distractions, and environmental cues that help you start work.",
    category: "건강과 환경",
    summary: [
      "Your environment guides behavior in place of willpower. Cut distractions and add starting cues.",
      "Rather than eliminating noise, it's easier to turn it into predictable sound.",
      "Separate your work space from your rest space as much as you can.",
    ],
    related: ["body-care-habits", "body-doubling", "pomodoro-for-writers"],
    sections: [
      {
        heading: "Why your environment matters",
        paragraphs: [
          "The same person can focus easily in one environment and not write a single line in another. Changing your environment is far easier and longer lasting than trying to solve it with willpower. If you build an environment where work starts as soon as you sit at the desk, you save the energy spent each time wondering \"should I or shouldn't I?\"",
        ],
      },
      {
        heading: "Lighting",
        bullets: [
          "A big difference between screen and surrounding brightness tires your eyes easily. Don't leave only the screen bright in a dark room",
          "Light your desk with indirect lighting or a desk lamp, and adjust its position so light doesn't reflect off the screen",
          "At night, use the feature that warms your screen's color temperature to ease the strain on your eyes",
          "If you draw by hand, have light come from the upper left if you're right-handed to reduce shadows",
        ],
      },
      {
        heading: "Noise",
        paragraphs: [
          "It is hard to eliminate noise completely. Instead, turn it into predictable sound or adjust the time of day.",
        ],
        steps: [
          "Seal gaps around the door or use thick curtains to reduce outside noise.",
          "Play steady white noise such as rain, waves or a fan at low volume to mask sudden sounds.",
          "Music with lyrics can get in the way of writing, so choose instrumentals or ambient sound.",
          "Agree on \"focus hours\" with your family or roommates in advance and agree not to talk to you during those times.",
          "During noisy hours, move to a place where you can work, such as a library or cafe.",
        ],
      },
      {
        heading: "Tidying your desk",
        paragraphs: [
          "Having many visible objects on your desk scatters your focus. Keep only what you need for work and move the rest to a drawer or elsewhere. If you get into the habit of tidying your desk for a minute before work, that also serves as a starting ritual.",
        ],
        example: {
          title: "What to keep on the desk / what to clear away",
          lines: [
            "Keep: laptop or tablet, water, notepad and pen, timer",
            "Clear away: phone (another room or inside a bag), half-eaten snacks, unread mail, unrelated books",
          ],
        },
      },
      {
        heading: "Cutting distractions",
        bullets: [
          "Put your phone somewhere other than on the desk. Just being out of sight reduces how often you check it",
          "Make a separate browser profile for work so it has no social media bookmarks",
          "Turn off all notifications during focus time. Set it to allow only certain people through for urgent contact",
          "Keeping an online studio open where you can see others working reduces the time you spend slacking",
        ],
      },
      {
        heading: "Separate your work space from your rest space",
        paragraphs: [
          "Working in bed blurs the line between rest and work and makes it easy to do neither well. If space is tight, try creating a starting cue for work, such as turning on a desk light or playing a particular piece of music. When the cue repeats, your body learns that \"now is work time.\"",
        ],
      },
      {
        heading: "Change your environment and keep notes",
        paragraphs: [
          "Each time you change one thing in your environment, briefly note that day's focus and output. If you change several things at once you can't tell what worked. If you change one thing a week and note the result, you can find the combination that suits you.",
        ],
      },
      {
        heading: "Try it yourself: a 15-minute desk check",
        paragraphs: [
          "You don't have to change your environment all at once. Change one thing a day and note the difference.",
        ],
        steps: [
          "Take a photo of your desk and clear away everything unrelated to work.",
          "Fix one uncomfortable thing among monitor height, chair height and lighting position.",
          "Move your phone off the desk and turn off notifications.",
          "Work in this setup for a week, note how your focus was, and pick one more improvement.",
        ],
      },
    ],
  },

  "sleep-and-deadlines": {
    slug: "sleep-and-deadlines",
    title: "Protecting Your Sleep During Deadlines: Options Other Than All-Nighters",
    description:
      "Sleep is the first thing cut at deadline time, but lack of sleep lowers the quality and speed of your writing. How to schedule sleep first, minimum rules when an all-nighter is unavoidable, and how to recover your rhythm.",
    category: "건강과 환경",
    summary: [
      "Sleep isn't \"leftover time\". It is the first item you put in your schedule.",
      "Much of the time you gain from an all-nighter is paid back in the next day's speed and revision quality.",
      "If sleep problems continue for long or interfere with daily life, talk to a professional.",
    ],
    related: ["body-care-habits", "slump-types", "weekly-writing-plan"],
    sections: [
      {
        heading: "Before you start",
        paragraphs: [
          "This article is general information about lifestyle habits and is not a substitute for medical diagnosis or treatment. If insomnia continues for a long time or you are very sleepy during the day, talk to a medical professional.",
          "As a deadline nears, cutting sleep to secure work time seems like the easiest choice. But even an hour of work when you are short on sleep means lower concentration and more mistakes, so in the end you spend more time revising. The time you earn by cutting sleep is often much less than it seems.",
        ],
      },
      {
        heading: "How lack of sleep affects your work",
        bullets: [
          "Your focus scatters easily and you reread the same sentence several times",
          "Your sentences become monotonous and choosing expressions takes longer",
          "You get worse at spotting typos and setting errors",
          "Emotional control gets harder and you become overly sensitive to the work or readers' reactions",
          "Recovery takes time the next day and your working rhythm collapses",
        ],
      },
      {
        heading: "Schedule sleep first",
        paragraphs: [
          "When you make a timetable, change the order. Instead of writing work first and sleeping in the leftover time, write sleep, meals and travel time first and fit work into the remaining time. That way you see the work time you actually have, and the plan becomes realistic.",
        ],
        example: {
          title: "Example schedule five days before a deadline (full-time creator)",
          lines: [
            "Bed 23:30 / wake 07:00 (secure seven and a half hours of sleep first)",
            "08:00–12:00 writing (the hardest work in the morning)",
            "12:00–13:30 lunch and a walk",
            "13:30–17:30 writing or revision",
            "18:00–19:30 dinner and rest",
            "20:00–22:00 light work (organizing materials, notes), then wrap up",
            "After 22:00 turn off screens and get ready for bed",
          ],
        },
      },
      {
        heading: "Minimum rules when an all-nighter is unavoidable",
        paragraphs: [
          "Situations can arise where you really have to stay up all night. In that case, set rules to reduce the damage. An all-nighter is an exception, and the premise is that you don't repeat it.",
        ],
        steps: [
          "If possible, take a short nap (20–30 minutes) during the day before the all-nighter.",
          "During the all-nighter, work 50 minutes and rest 10, and get up and move during breaks.",
          "In the sleepiest hours before dawn, put simple tasks rather than judgment-heavy work like revision.",
          "Read through and check text you produced right after an all-nighter once more after sleeping before you submit it.",
          "Go to bed as early as you can the next day and lighten your schedule to recover. Avoid two all-nighters in a row.",
        ],
      },
      {
        heading: "Handling caffeine and drowsiness",
        bullets: [
          "Caffeine late in the afternoon can affect your night's sleep. Set a last-intake time that fits your sensitivity",
          "When sleepy, washing your face with cold water, standing up to walk and airing out the room work right away",
          "Resting your eyes for 15–20 minutes is often better for later efficiency than sitting and fighting sleepiness",
          "If you keep relying heavily on energy drinks and caffeine, check your sleep and schedule first",
        ],
      },
      {
        heading: "Habits that improve sleep quality",
        bullets: [
          "Prioritize waking at the same time every day. Even if bedtime varies a little, a steady wake time sets your rhythm",
          "For an hour before bed, lower screen brightness and keep distance from your work. If thoughts of work continue, write tomorrow's tasks on paper and close it",
          "Keep your bedroom dark and quiet, and avoid working in bed if you can",
          "When you can't sleep, rather than forcing yourself to lie there, get up, do something quiet and go back to bed when sleepy",
          "Make time to walk in daylight",
        ],
      },
      {
        heading: "Recovering after the deadline",
        paragraphs: [
          "Right after finishing a deadline, don't go straight into the next task. Leave at least one day free for rest. Getting plenty of sleep and bringing your rhythm back with a light walk or a meal is preparation for the next deadline. If you build rest into your schedule from the start, the letdown and guilt after a deadline also decrease.",
        ],
      },
    ],
  },
};
