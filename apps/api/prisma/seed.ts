import { PrismaClient, Subject, ExamMode, QuestionType, Difficulty } from "@prisma/client";
const prisma = new PrismaClient();

const courses = [
  { subject: Subject.MATH, title: "GED Mathematical Reasoning", slug: "math", desc: "Algebra, geometry, data and quantitative reasoning.", progress: 48 },
  { subject: Subject.SCIENCE, title: "GED Science", slug: "science", desc: "Life science, physical science and data analysis.", progress: 34 },
  { subject: Subject.SOCIAL_STUDIES, title: "GED Social Studies", slug: "social-studies", desc: "Civics, history, economics and source analysis.", progress: 22 },
  { subject: Subject.RLA, title: "GED Reasoning Through Language Arts", slug: "rla", desc: "Reading, language, editing and extended response.", progress: 65 }
];

async function main() {
  for (const c of courses) {
    const course = await prisma.course.upsert({
      where: { id: `course-${c.slug}` },
      update: { progress: c.progress },
      create: {
        id: `course-${c.slug}`,
        title: c.title,
        subject: c.subject,
        description: c.desc,
        progress: c.progress
      }
    });

    const module = await prisma.module.upsert({
      where: { id: `${course.id}-module-1` },
      update: {},
      create: { id: `${course.id}-module-1`, courseId: course.id, title: "Core Skills", order: 1 }
    });

    for (let i = 1; i <= 3; i++) {
      await prisma.lesson.upsert({
        where: { id: `${module.id}-lesson-${i}` },
        update: {},
        create: {
          id: `${module.id}-lesson-${i}`,
          moduleId: module.id,
          title: `${c.title} Lesson ${i}`,
          content: "Practice the core skill using worked examples, short drills and reflection.",
          order: i
        }
      });
    }

    const demoExamId = `exam-${c.slug}`;
    await prisma.exam.upsert({
      where: { id: demoExamId },
      update: {},
      create: {
        id: demoExamId,
        courseId: course.id,
        title: `${c.title} Practice`,
        description: `Targeted practice exam for ${c.title}.`,
        subject: c.subject,
        mode: ExamMode.PRACTICE,
        durationSeconds: c.subject === Subject.RLA ? 45 * 60 : 40 * 60,
        passingScore: 60
      }
    });
  }

  // RLA detailed exam
  const rla = await prisma.course.findUnique({ where: { id: "course-rla" } });
  if (!rla) throw new Error("RLA course missing.");

  await prisma.exam.deleteMany({ where: { id: "exam-rla-detailed" } });

  const exam = await prisma.exam.create({
    data: {
      id: "exam-rla-detailed",
      courseId: rla.id,
      title: "Argumentative Reading & Language Practice",
      description: "Reading passage, editing and reasoning practice.",
      subject: Subject.RLA,
      mode: ExamMode.PRACTICE,
      durationSeconds: 45 * 60,
      passingScore: 60,
      passages: {
        create: [{
          id: "passage-rla-1",
          title: "Libraries in a Digital Age",
          content: `Public libraries have changed as digital information has become easier to access. Yet their value is not limited to printed books. Libraries provide technology, study spaces, research guidance and programs that connect people with one another.

Critics sometimes argue that internet access makes libraries unnecessary. The argument is understandable: someone with a reliable connection can find enormous amounts of information without entering a library. But access to information is not the same as access to reliable information, guidance, or a supportive learning environment.

Libraries also reduce practical barriers. A student without a laptop can use a public computer. A job seeker can receive help preparing a résumé. A community member can attend a language program. These services help people use information effectively rather than simply providing information.

For these reasons, communities should treat libraries as learning infrastructure. Their role may evolve, but the need for accessible places, tools and guidance remains.`,
          order: 1
        }]
      }
    }
  });

  await prisma.question.createMany({
    data: [
      {
        id: "rla-q1", examId: exam.id, passageId: "passage-rla-1", order: 1,
        text: "What is the author's primary claim?",
        type: QuestionType.MULTIPLE_CHOICE,
        explanation: "The passage argues that libraries remain important because they provide learning resources and support beyond book storage.",
        topic: "Main Claim", difficulty: Difficulty.MEDIUM
      },
      {
        id: "rla-q2", examId: exam.id, passageId: "passage-rla-1", order: 2,
        text: "Which example best illustrates the author's point about reducing barriers?",
        type: QuestionType.MULTIPLE_CHOICE,
        explanation: "The example of a student using a public computer directly illustrates reduced access barriers.",
        topic: "Evidence", difficulty: Difficulty.MEDIUM
      },
      {
        id: "rla-q3", examId: exam.id, passageId: "passage-rla-1", order: 3,
        text: "The author acknowledges an opposing view and then explains why it is incomplete. This is an example of:",
        type: QuestionType.MULTIPLE_CHOICE,
        explanation: "The author fairly represents a counterclaim before responding to its limitation.",
        topic: "Counterargument", difficulty: Difficulty.MEDIUM
      },
      {
        id: "rla-q4", examId: exam.id, passageId: "passage-rla-1", order: 4,
        text: "Complete the sentence: Libraries are not merely places that store ______.",
        type: QuestionType.FILL_BLANK,
        explanation: "The conclusion contrasts learning infrastructure with simple storage of books.",
        topic: "Reading Detail", difficulty: Difficulty.EASY,
        data: { acceptedAnswer: "books" }
      },
      {
        id: "rla-q5", examId: exam.id, passageId: "passage-rla-1", order: 5,
        text: "Choose the sentence that best improves clarity in an academic response.",
        type: QuestionType.DROPDOWN,
        explanation: "The clearer sentence uses a direct subject and verb.",
        topic: "Editing", difficulty: Difficulty.MEDIUM
      }
    ]
  });

  const optionSets: Record<string, [string, string, boolean][]> = {
    "rla-q1": [["A","Libraries should stop buying printed books.",false],["B","Libraries remain valuable learning resources despite digital access.",true],["C","Internet access is available to everyone.",false],["D","Job seekers are the main library users.",false]],
    "rla-q2": [["A","Libraries have changed.",false],["B","A student without a laptop can use a public computer.",true],["C","The internet contains much information.",false],["D","Critics disagree with libraries.",false]],
    "rla-q3": [["A","Anecdote",false],["B","Counterargument and response",true],["C","Definition",false],["D","Chronological narration",false]],
    "rla-q5": [["A","Libraries help people because they provide tools and guidance.",true],["B","Libraries, which is useful, help people.",false],["C","People use libraries and it is good.",false],["D","Because libraries are useful.",false]]
  };
  for (const [qid, opts] of Object.entries(optionSets)) {
    await prisma.option.createMany({
      data: opts.map(([label,text,isCorrect], i) => ({ id: `${qid}-${i}`, questionId: qid, label, text, isCorrect }))
    });
  }

  // math / science / social sample questions
  const subjectExam = [
    { id:"exam-math", q:[
      {id:"math-q1",text:"Solve x + 7 = 12.",type:QuestionType.FILL_BLANK,topic:"Algebra",data:{acceptedAnswer:"5"}},
      {id:"math-q2",text:"What is the slope of a line that rises 6 units and runs 3 units?",type:QuestionType.MULTIPLE_CHOICE,topic:"Algebra"},
    ]},
    { id:"exam-science", q:[
      {id:"science-q1",text:"Which statement best describes a control group in an experiment?",type:QuestionType.MULTIPLE_CHOICE,topic:"Experimental Design"},
      {id:"science-q2",text:"A sample changes from 20 to 30. What is the percent increase?",type:QuestionType.FILL_BLANK,topic:"Data Analysis",data:{acceptedAnswer:"50"}},
    ]},
    { id:"exam-social-studies", q:[
      {id:"social-q1",text:"Which principle limits government power by dividing authority among branches?",type:QuestionType.MULTIPLE_CHOICE,topic:"Civics"},
      {id:"social-q2",text:"A source argues that a policy should change. Which evidence would best evaluate the claim?",type:QuestionType.MULTIPLE_CHOICE,topic:"Source Analysis"},
    ]}
  ];
  for (const set of subjectExam) {
    const ex = await prisma.exam.findUnique({ where: { id: set.id } });
    if (!ex) continue;
    for (let i=0;i<set.q.length;i++) {
      const q = set.q[i];
      const existing = await prisma.question.findUnique({where:{id:q.id}});
      if (!existing) {
        await prisma.question.create({data:{
          id:q.id, examId:ex.id, order:i+1, text:q.text, type:q.type, topic:q.topic,
          explanation:"Use the evidence and apply the relevant concept.",
          data:q.data
        }});
        if (q.type===QuestionType.MULTIPLE_CHOICE) {
          const opts = q.id==="math-q2"
            ? [["A","1",false],["B","2",true],["C","3",false],["D","6",false]]
            : q.id==="science-q1"
              ? [["A","The variable being tested is always increased.",false],["B","A baseline used for comparison.",true],["C","The result is ignored.",false],["D","A second hypothesis.",false]]
              : q.id==="science-q2"
                ? []
                : q.id==="social-q1"
                  ? [["A","Judicial review",false],["B","Separation of powers",true],["C","Popular sovereignty",false],["D","Federalism",false]]
                  : [["A","An unrelated opinion.",false],["B","Evidence tied directly to the policy's effects.",true],["C","A rumor.",false],["D","A definition of a different policy.",false]];
          await prisma.option.createMany({
  data: (opts as any[]).map(([label, text, isCorrect]: any, j: number) => ({
    id: `${q.id}-${j}`,
    questionId: q.id,
    label: String(label),
    text: String(text),
    isCorrect: Boolean(isCorrect)
  }))
});
        }
      }
    }
  }

  // Flashcards
  const flash = [
    ["capital expenditure","Spending on long-term assets such as equipment or buildings.",["vocabulary","business"]],
    ["inference","A conclusion supported by clues and evidence in a text.",["reading"]],
    ["counterargument","A position that challenges the main claim.",["rla","argument"]],
    ["variable","A factor that can change in an experiment.",["science"]],
    ["slope","The rate of change in a line, often rise over run.",["math","algebra"]]
  ];
  for (const item of flash) {
  const front = String(item[0]);
  const back = String(item[1]);
  const tags = item[2] as string[];

  const exists = await prisma.flashcard.findFirst({
    where: { courseId: rla.id, front },
  });
  if (!exists) {
    await prisma.flashcard.create({
      data: { courseId: rla.id, front, back, tags },
    });
  }
}

  await prisma.examSchedule.createMany({
    data: [
      { examId:"exam-rla-detailed", scheduledAt:new Date(Date.now()+24*3600*1000), label:"GED Mock Test #4" },
    ],
    skipDuplicates: true
  });

  console.log("FINAL seed complete.");
}

main().finally(() => prisma.$disconnect());
