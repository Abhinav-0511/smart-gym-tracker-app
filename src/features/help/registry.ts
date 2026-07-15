import type { PageHelpConfig } from "@/features/help/types";

/**
 * The single source of truth for contextual help. Every entry is authored from
 * the target page's actual JSX so its tips, FAQ and "About" markers only ever
 * describe controls that exist. To update help when a page changes, edit the
 * matching entry here — nothing else.
 *
 * Keys follow "<workspace>.<page>" (e.g. "finance.budgets").
 */
export const HELP_CONTENT: Record<string, PageHelpConfig> = {
  // ------------------------------------------------------------------ Fitness
  "fitness.dashboard": {
    pageKey: "fitness.dashboard",
    title: "Fitness Dashboard",
    about: {
      screenshot: "fitness_dashboard.png",
      intro:
        "Your fitness home. It surfaces the single most useful next action, your key stats, and today's training at a glance.",
      markers: [
        { n: 1, label: "Header", description: "Greeting, workspace switcher, Help, notifications and your profile avatar." },
        { n: 2, label: "Status card", description: "A live summary of your next step — start today's workout, resume an autosaved session, or review a completed one." },
        { n: 3, label: "Stat grid", description: "Current and longest streak, total workouts, PR count, this week's completed days, and your active plan." },
        { n: 4, label: "Today's Workout", description: "Today's planned session (or rest day). Tap to open it; a completed day shows a Review action instead." },
        { n: 5, label: "Primary action", description: "One button that adapts: Start Workout, Continue Workout, Review Workout, or Create Workout Plan." },
        { n: 6, label: "This Week", description: "Seven-day strip marking completed days and rest days for the current week." },
        { n: 7, label: "Summaries", description: "Your last saved workout and a summary of your active plan's training days and exercises." },
        { n: 8, label: "Recent PRs", description: "Your latest personal records, with View All to open the full list." },
      ],
    },
    tips: [
      "Your streak counts consecutive days with a completed workout — finishing today's session keeps it alive.",
      "The big action button changes with context: it starts today's planned workout, resumes an autosaved session, or creates a plan when you don't have one.",
      "Tap the Today's Workout card or a workout in progress to jump straight into the session.",
      "No plan yet? Use Create Workout Plan to add training days and exercises before your first session.",
    ],
    faq: [
      { q: "Why is my current streak 0?", a: "Streaks count days with a completed workout. Complete today's session to start one — it resets if a scheduled day is missed." },
      { q: "How is “This Week” calculated?", a: "It shows how many of the seven days this week have a completed workout saved, alongside your plan's rest days." },
      { q: "Where do my Recent PRs come from?", a: "Completing weighted sets records personal records automatically. The three most recent appear here; View All opens the full Personal Records page." },
      { q: "How do I change my workout plan?", a: "Open Plan from the navigation, or tap the Plan Summary card, to edit training days and exercises." },
    ],
  },
  "fitness.workout": {
    pageKey: "fitness.workout",
    title: "Workout",
    about: {
      screenshot: "workout_session.png",
      intro:
        "The active workout logger. Pick a day from your plan, log each set's reps and weight, and finish to save the session to your history.",
      markers: [
        { n: 1, label: "Workout day", description: "Choose which day of your active plan to train; its exercises load below." },
        { n: 2, label: "Exercises & sets", description: "Log reps and weight for each set and tick sets off as you complete them." },
        { n: 3, label: "Add Exercise", description: "Add an extra exercise to this session on the fly." },
        { n: 4, label: "Notes", description: "Record how the session felt or any adjustments for next time." },
        { n: 5, label: "Start / Finish", description: "Start the workout, then Finish Workout to save it and update your streak and PRs." },
      ],
    },
    tips: [
      "Your session autosaves as you go, so you can leave and come back without losing progress.",
      "Completing weighted sets automatically records new personal records — no separate step needed.",
      "Use Add Exercise to include something that isn't in the plan for that day.",
      "Finishing the workout is what counts it toward your streak and this week's completed days.",
    ],
    faq: [
      { q: "Do I have to finish in one sitting?", a: "No. The session is autosaved, so you can close the app mid-workout and resume it from the dashboard or this page later." },
      { q: "How are personal records created?", a: "When you complete a weighted set that beats your previous best for that exercise, it's saved as a PR automatically." },
      { q: "Can I add an exercise not in my plan?", a: "Yes — use Add Exercise during the session to log anything extra." },
    ],
  },
  "fitness.plan": {
    pageKey: "fitness.plan",
    title: "Workout Plan",
    about: {
      screenshot: "workout_plan.png",
      intro:
        "Build and manage your weekly training plans. Add up to seven days, each with its own exercises, and choose which plan is active.",
      markers: [
        { n: 1, label: "Active plan", description: "Select which plan is currently active — the dashboard and Workout page follow it." },
        { n: 2, label: "Training days", description: "Each day lists its workout type and exercises. Add up to seven days per plan." },
        { n: 3, label: "Add Workout Day", description: "Add a new training day; disabled once all seven days exist." },
        { n: 4, label: "Add Exercise", description: "Add exercises to a day, then edit or remove days as your routine changes." },
        { n: 5, label: "Create / Edit", description: "Create a new plan, rename an existing one, or delete plans and days you no longer need." },
      ],
    },
    tips: [
      "Only one plan is active at a time — switching the active plan updates what today's workout shows.",
      "A plan can hold up to seven days; the Add Workout Day button disables once you've added them all.",
      "Days without a rest flag become trainable workouts on the dashboard.",
      "Deleting a plan or day asks for confirmation first, so you won't remove one by accident.",
    ],
    faq: [
      { q: "How many days can a plan have?", a: "Up to seven — one per day of the week. The Add Workout Day button turns off when all seven exist." },
      { q: "How do I switch which plan is active?", a: "Use the active-plan selector at the top of the page; the dashboard and Workout page immediately follow the active plan." },
      { q: "What happens when I delete a plan?", a: "It's removed after a confirmation prompt. Your saved workout history stays intact." },
    ],
  },
  "fitness.prs": {
    pageKey: "fitness.prs",
    title: "Personal Records",
    about: {
      screenshot: "personal_records.png",
      intro:
        "Every personal record you've set. Records are captured automatically from completed workouts, and you can also add or edit manual entries.",
      markers: [
        { n: 1, label: "Add PR", description: "Add a manual personal record for lifts done outside a logged workout." },
        { n: 2, label: "Records list", description: "Each exercise's best result. Manual records can be edited or deleted." },
        { n: 3, label: "Chart exercise", description: "Pick an exercise to chart its progression over time." },
        { n: 4, label: "Set History & PR Timeline", description: "Review your completed set history and how your records improved." },
      ],
    },
    tips: [
      "Completing weighted sets in a workout records PRs automatically — you don't have to add them by hand.",
      "Use Add PR only for lifts you did outside the app that you still want tracked.",
      "Only manually added records can be edited or deleted; auto-recorded ones come from your workout history.",
      "Select an exercise to see its PR timeline and set history charted.",
    ],
    faq: [
      { q: "How do most PRs get here?", a: "Automatically. Finishing weighted sets that beat your previous best records a PR for that exercise." },
      { q: "Can I edit a personal record?", a: "You can edit or delete manual records you added. Records derived from workouts reflect your logged history." },
      { q: "What do the charts show?", a: "Choosing an exercise plots its progression and lists your completed set history and PR timeline." },
    ],
  },
  "fitness.progress": {
    pageKey: "fitness.progress",
    title: "Progress",
    about: {
      screenshot: "fitness_progress.png",
      intro:
        "Charts of how you're trending — training volume and consistency over time, plus per-exercise progression.",
      markers: [
        { n: 1, label: "Summary stats", description: "Headline measures of your recent training activity." },
        { n: 2, label: "Trend charts", description: "Visualise workouts and consistency across time." },
        { n: 3, label: "Exercise selector", description: "Choose an exercise to chart its specific progression." },
      ],
    },
    tips: [
      "Charts fill in as you complete more workouts, so the more you log the clearer the trends.",
      "Use the exercise selector to focus the charts on a single movement.",
      "Progress here is built from your saved workout history — logging sessions keeps it accurate.",
    ],
    faq: [
      { q: "Why do my charts look empty?", a: "They populate from completed workouts. Log and finish a few sessions and the trends will appear." },
      { q: "Can I see one exercise at a time?", a: "Yes — pick an exercise from the selector to chart just that movement's progression." },
    ],
  },
  "fitness.profile": {
    pageKey: "fitness.profile",
    title: "Fitness Profile",
    about: {
      screenshot: "profile_page.png",
      intro:
        "Your fitness identity and lifetime stats, your achievements, and your shared account settings.",
      markers: [
        { n: 1, label: "Lifetime stats", description: "Streaks, total workouts, PR count, weekly completion and overall completion." },
        { n: 2, label: "Achievements", description: "Badges you've unlocked, with progress toward the ones you haven't." },
        { n: 3, label: "Account", description: "Shared account card — edit your details, switch theme, change your password, or sign out." },
      ],
    },
    tips: [
      "The Account card is shared across every module, so changes here apply everywhere in LifeTrack.",
      "Switch between light and dark theme from the Account card's Dark mode toggle.",
      "Achievements unlock automatically as you hit milestones — no need to claim them.",
    ],
    faq: [
      { q: "Where did the theme toggle go?", a: "Theme now lives in your Account settings as the Dark mode toggle — the header button is Help." },
      { q: "Do achievements need to be claimed?", a: "No. They unlock on their own once you reach the milestone, and show progress until then." },
      { q: "Is my account shared across modules?", a: "Yes. The one account powers Fitness, Productivity and Finance, so profile and theme changes apply everywhere." },
    ],
  },

  // ------------------------------------------------------------- Productivity
  "productivity.dashboard": {
    pageKey: "productivity.dashboard",
    title: "Productivity Dashboard",
    about: {
      screenshot: "productivity_dashboard.png",
      intro:
        "Your day at a glance — today's habits and tasks, your completion for the day, and quick ways to add more.",
      markers: [
        { n: 1, label: "Greeting & quick add", description: "A daily greeting with quick actions to add a habit or a task." },
        { n: 2, label: "Completion", description: "How much of today you've completed across habits and tasks." },
        { n: 3, label: "Today's habits", description: "Tap a habit to mark it done for today and grow its streak." },
        { n: 4, label: "Today's tasks", description: "Check off tasks as you finish them." },
      ],
    },
    tips: [
      "Tap a habit to log it for today — that's what builds and keeps its streak.",
      "Use the quick-add buttons to create a habit or task without leaving the dashboard.",
      "Your daily completion updates instantly as you tick habits and tasks off.",
    ],
    faq: [
      { q: "How do I complete a habit?", a: "Tap it on the dashboard (or in the Habits page) to log it for today. Doing so extends its streak." },
      { q: "What counts toward today's completion?", a: "Your habits due today and your tasks — completing them raises the day's completion percentage." },
    ],
  },
  "productivity.habits": {
    pageKey: "productivity.habits",
    title: "Habits",
    about: {
      screenshot: "habits_page.png",
      intro:
        "Create and track your habits. Each habit keeps a streak, and you can search, edit, or delete them.",
      markers: [
        { n: 1, label: "New Habit", description: "Create a habit with its own icon and colour." },
        { n: 2, label: "Search", description: "Filter your habits by name." },
        { n: 3, label: "Habit cards", description: "Each shows its current streak; tap to mark it complete for today." },
        { n: 4, label: "Best streak", description: "A summary of your strongest current streak across all habits." },
      ],
    },
    tips: [
      "Marking a habit complete each day it's due is what grows its streak.",
      "Use search to quickly find a habit when your list gets long.",
      "Deleting a habit asks you to confirm first, so you won't remove one accidentally.",
    ],
    faq: [
      { q: "How do streaks work?", a: "A habit's streak counts the consecutive days you've completed it. Missing a due day resets that streak." },
      { q: "Can I change a habit later?", a: "Yes — open a habit to edit it, or delete it (with a confirmation) if you no longer want to track it." },
    ],
  },
  "productivity.tasks": {
    pageKey: "productivity.tasks",
    title: "Tasks",
    about: {
      screenshot: "tasks_page.png",
      intro:
        "Manage your to-dos. Add tasks with a priority, search and filter them, and check them off as you go.",
      markers: [
        { n: 1, label: "New Task", description: "Add a task, optionally with a due date and priority." },
        { n: 2, label: "Search & filter", description: "Search by name and filter by priority." },
        { n: 3, label: "Task list", description: "Tap a task's checkbox to mark it complete; open it to edit." },
      ],
    },
    tips: [
      "Set a priority when creating a task, then use the priority filter to focus on what matters.",
      "Check a task off to complete it — completed tasks count toward your productivity stats.",
      "Search by name to find a task quickly in a long list.",
    ],
    faq: [
      { q: "How do I complete a task?", a: "Tap its checkbox in the list. You can also reopen it if you checked it off by mistake." },
      { q: "Can I filter my tasks?", a: "Yes — filter by priority and search by name to narrow the list." },
    ],
  },
  "productivity.calendar": {
    pageKey: "productivity.calendar",
    title: "Calendar",
    about: {
      screenshot: "productivity_calendar.png",
      intro:
        "A monthly view of your habits and tasks. Move between months and open any day to see and complete what was scheduled.",
      markers: [
        { n: 1, label: "Month navigation", description: "Step to the previous or next month, or jump back to today." },
        { n: 2, label: "Month grid", description: "Each day reflects your habit and task activity for that date." },
        { n: 3, label: "Day detail", description: "Tap a day to open its habits and tasks and complete them." },
      ],
    },
    tips: [
      "Tap any day to open its detail sheet and complete that day's habits and tasks.",
      "Use the Today button to jump straight back to the current month.",
      "The calendar reflects your real habit and task history, so it stays in sync with the other pages.",
    ],
    faq: [
      { q: "Can I complete things from the calendar?", a: "Yes — open a day and you can mark that day's habits and tasks complete right there." },
      { q: "How far back can I look?", a: "Use the previous/next arrows to move through months; your history shows on the days it happened." },
    ],
  },
  "productivity.reports": {
    pageKey: "productivity.reports",
    title: "Reports",
    about: {
      screenshot: "productivity_reports.png",
      intro:
        "Your productivity trends. Switch the reporting period and see completion over time alongside habit and task stats.",
      markers: [
        { n: 1, label: "Period", description: "Choose the reporting window (for example week or month)." },
        { n: 2, label: "Completion trend", description: "A chart of how your completion changes across the selected period." },
        { n: 3, label: "Habit & task stats", description: "Summary figures for streaks and completed work." },
      ],
    },
    tips: [
      "Switch the period to compare a shorter or longer window of your activity.",
      "The trend chart is built from your logged habits and tasks, so keep logging for richer reports.",
    ],
    faq: [
      { q: "What time ranges can I report on?", a: "Use the period selector to switch the reporting window and the chart updates to match." },
      { q: "Why is a report sparse?", a: "Reports draw on your completed habits and tasks. The more you log, the more the charts fill in." },
    ],
  },

  // ------------------------------------------------------------------ Finance
  "finance.dashboard": {
    pageKey: "finance.dashboard",
    title: "Finance Dashboard",
    about: {
      screenshot: "finance_dashboard.png",
      intro:
        "Your money this month — income and spending totals, and a quick way to add transactions. Move between months to review any period.",
      markers: [
        { n: 1, label: "Month navigation", description: "Switch the month you're viewing; totals and lists update to match." },
        { n: 2, label: "Add Transaction", description: "Record income, an expense, or a transfer between accounts." },
        { n: 3, label: "Summary", description: "This month's income, expenses and balance at a glance." },
        { n: 4, label: "Recent activity", description: "Your latest transactions and upcoming recurring items." },
      ],
    },
    tips: [
      "Use the month navigator to look back at previous months — every figure recalculates for that period.",
      "Add Transaction lets you log income, expenses and transfers between your accounts.",
      "Recurring templates you set up appear as upcoming items to keep bills on your radar.",
    ],
    faq: [
      { q: "How do I view a different month?", a: "Use the month navigation at the top; the dashboard's totals and lists follow the selected month." },
      { q: "What transaction types are supported?", a: "Income, expense, and transfers between two of your accounts." },
    ],
  },
  "finance.transactions": {
    pageKey: "finance.transactions",
    title: "Transactions",
    about: {
      screenshot: "finance_transactions.png",
      intro:
        "Every transaction, searchable and filterable, plus your recurring templates. Add, edit or delete entries here.",
      markers: [
        { n: 1, label: "Add", description: "Add a one-off transaction, or switch to the recurring view to add a template." },
        { n: 2, label: "Search", description: "Find transactions by title." },
        { n: 3, label: "Transaction list", description: "Income, expense and transfer entries; open one to edit or delete it." },
        { n: 4, label: "Recurring", description: "Manage repeating income or bills that post on a schedule." },
      ],
    },
    tips: [
      "Switch to the recurring view to set up salary, rent or subscriptions that repeat automatically.",
      "Search by title to locate a specific transaction quickly.",
      "Deleting a transaction asks for confirmation, so accidental removals are avoided.",
    ],
    faq: [
      { q: "What's the difference between a transaction and a recurring item?", a: "A transaction is a single entry; a recurring template repeats on a schedule (weekly, monthly, and so on) and posts real transactions." },
      { q: "Can I edit a past transaction?", a: "Yes — open any transaction to change its details or delete it." },
    ],
  },
  "finance.budgets": {
    pageKey: "finance.budgets",
    title: "Budgets",
    about: {
      screenshot: "finance_budgets.png",
      intro:
        "Set spending caps and track them against your real transactions. Also manage the accounts your money lives in.",
      markers: [
        { n: 1, label: "Budgeted total", description: "The sum of your budget caps for the period." },
        { n: 2, label: "New Budget", description: "Create a budget for a category or an overall cap." },
        { n: 3, label: "Budget cards", description: "Each shows spent versus your cap so you can see what's left." },
        { n: 4, label: "Accounts", description: "Add and manage cash, bank, card and wallet accounts and their balances." },
      ],
    },
    tips: [
      "A budget's spend is calculated live from your transactions — logging expenses keeps it accurate.",
      "You can set a cap per category or one overall spending cap.",
      "Add your accounts (cash, bank, cards, wallets) so transactions can track their balances.",
    ],
    faq: [
      { q: "How is a budget's “spent” figure worked out?", a: "It's derived from your actual transactions in that category for the period, so it updates as you log spending." },
      { q: "What are accounts for?", a: "Accounts are the buckets your money sits in. Assigning transactions to them tracks each account's balance." },
    ],
  },
  "finance.goals": {
    pageKey: "finance.goals",
    title: "Savings",
    about: {
      screenshot: "finance_savings.png",
      intro:
        "Save toward goals. Set a target, add or withdraw funds, and watch each goal's completion grow.",
      markers: [
        { n: 1, label: "Goals summary", description: "How many goals you're currently saving toward." },
        { n: 2, label: "New Goal", description: "Create a savings goal with a target amount." },
        { n: 3, label: "Goal cards", description: "Each shows progress to target; use Add Funds to contribute or withdraw." },
      ],
    },
    tips: [
      "Use Add Funds on a goal to record contributions — its completion percentage updates as you save.",
      "A goal's progress is its current balance against the target you set.",
      "Edit or delete a goal any time as your plans change.",
    ],
    faq: [
      { q: "How do I add money to a goal?", a: "Open the goal and use Add Funds to record a contribution (or a withdrawal). Progress recalculates automatically." },
      { q: "What does the completion percentage mean?", a: "It's your goal's current saved amount as a share of its target." },
    ],
  },
  "finance.reports": {
    pageKey: "finance.reports",
    title: "Reports",
    about: {
      screenshot: "finance_reports.png",
      intro:
        "Understand your money over a month — income versus expenses, spending by category, and daily activity.",
      markers: [
        { n: 1, label: "Month navigation", description: "Choose which month to analyse." },
        { n: 2, label: "Income vs expense", description: "A breakdown of what came in against what went out." },
        { n: 3, label: "Categories", description: "Your top spending categories, shown as a chart." },
        { n: 4, label: "Daily heatmap", description: "Where your spending fell across the days of the month." },
      ],
    },
    tips: [
      "Switch months to compare how your spending and income change over time.",
      "The category breakdown highlights where most of your money goes.",
      "Reports are built from your transactions, so keeping them up to date keeps reports accurate.",
    ],
    faq: [
      { q: "Can I report on a specific month?", a: "Yes — use the month navigation to pick a period; every chart recalculates for it." },
      { q: "Where does the data come from?", a: "Entirely from your logged transactions — nothing is estimated." },
    ],
  },

  // -------------------------------------------------------------------- Admin
  "admin.dashboard": {
    pageKey: "admin.dashboard",
    title: "Admin Portal",
    about: {
      screenshot: "admin_dashboard.png",
      intro:
        "The admin home. Headline counts across the app plus a recent-activity feed, with navigation to user, ticket and feedback management.",
      markers: [
        { n: 1, label: "Metrics", description: "Total users, new users this week, ticket counts and total feedback." },
        { n: 2, label: "Recent activity", description: "The newest support tickets and feedback across all users." },
        { n: 3, label: "Navigation", description: "Move between Dashboard, User Management, Support Tickets and Feedback." },
      ],
    },
    tips: [
      "Pending tickets counts those that are open or in progress — a quick measure of your support backlog.",
      "Open a ticket from Support Tickets to reply, change its status, and view any attached screenshot.",
      "Admin data is protected in the database, so only admin accounts can load these pages.",
    ],
    faq: [
      { q: "Who can see the Admin Portal?", a: "Only accounts flagged as admin in the database. Everyone else is redirected away and cannot read admin data." },
      { q: "Where do tickets and feedback come from?", a: "They're submitted by users through the Help Center's Contact Support and Feedback sections." },
    ],
  },
};

/** Look up a page's help config, or `null` when none is registered. */
export function getPageHelp(pageKey: string): PageHelpConfig | null {
  return HELP_CONTENT[pageKey] ?? null;
}
