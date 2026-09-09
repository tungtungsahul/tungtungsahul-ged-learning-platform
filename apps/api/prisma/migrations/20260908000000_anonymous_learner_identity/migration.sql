-- Learner identity is supplied by the anonymous browser identity rather than a
-- shared database default. Existing records retain their original learner ID.
ALTER TABLE "Attempt" ALTER COLUMN "learnerId" DROP DEFAULT;
ALTER TABLE "Mistake" ALTER COLUMN "learnerId" DROP DEFAULT;
ALTER TABLE "TutorConversation" ALTER COLUMN "learnerId" DROP DEFAULT;
