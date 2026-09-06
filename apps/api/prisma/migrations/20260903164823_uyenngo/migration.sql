-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('MATH', 'SCIENCE', 'SOCIAL_STUDIES', 'RLA', 'LISTENING', 'SPEAKING', 'READING', 'WRITING');

-- CreateEnum
CREATE TYPE "ExamMode" AS ENUM ('PRACTICE', 'MOCK', 'SKILL');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'FILL_BLANK', 'DROPDOWN', 'TRUE_FALSE', 'SHORT_ANSWER', 'DRAG_DROP');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "description" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "mode" "ExamMode" NOT NULL DEFAULT 'PRACTICE',
    "durationSeconds" INTEGER NOT NULL,
    "passingScore" INTEGER NOT NULL DEFAULT 60,
    "gedScaleMin" INTEGER NOT NULL DEFAULT 100,
    "gedScaleMax" INTEGER NOT NULL DEFAULT 200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passage" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "assetUrl" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Passage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioAsset" (
    "id" TEXT NOT NULL,
    "passageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "transcript" TEXT,

    CONSTRAINT "AudioAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "passageId" TEXT,
    "text" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "explanation" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "points" INTEGER NOT NULL DEFAULT 1,
    "topic" TEXT NOT NULL DEFAULT 'General',
    "data" JSONB,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL DEFAULT 'demo-learner',
    "examId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" INTEGER,
    "percentage" INTEGER,
    "gedScore" INTEGER,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "textValue" TEXT,
    "payload" JSONB,
    "answeredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "incorrectAnswers" INTEGER NOT NULL,
    "unanswered" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "gedScore" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "timeUsedSeconds" INTEGER NOT NULL,
    "details" JSONB,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSchedule" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "ExamSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mistake" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL DEFAULT 'demo-learner',
    "questionId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "note" TEXT,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mistake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flashcard" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Flashcard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorConversation" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL DEFAULT 'demo-learner',
    "subject" "Subject",
    "examId" TEXT,
    "attemptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TutorConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AudioAsset_passageId_key" ON "AudioAsset"("passageId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_attemptId_questionId_key" ON "Answer"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Result_attemptId_key" ON "Result"("attemptId");

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passage" ADD CONSTRAINT "Passage_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioAsset" ADD CONSTRAINT "AudioAsset_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "Option"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mistake" ADD CONSTRAINT "Mistake_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorMessage" ADD CONSTRAINT "TutorMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "TutorConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
