-- CreateTable
CREATE TABLE "faq_items" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" VARCHAR(100),
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_cache" (
    "id" SERIAL NOT NULL,
    "question_raw" TEXT NOT NULL,
    "question_normalized" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "llm_provider" VARCHAR(50),
    "hit_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_conversation_question_normalized" ON "conversation_cache"("question_normalized");
