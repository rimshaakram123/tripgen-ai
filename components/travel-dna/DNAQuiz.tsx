"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import DNAQuestion from "@/components/travel-dna/DNAQuestion";
import { questions } from "@/lib/travelDNAQuestions";
import { useTravelDNA } from "@/hooks/useTravelDNA";
import { calculateDNA, getPersonalityType } from "@/lib/travelDNAUtils";
import type { DNAQuestionOption } from "@/types/travelDNA";

export default function DNAQuiz() {
  const router = useRouter();
  const { saveDNA } = useTravelDNA();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<DNAQuestionOption[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSelect = useCallback(
    async (option: DNAQuestionOption) => {
      const newAnswers = [...answers, option];
      setAnswers(newAnswers);
      setIndex(index + 1);

      if (index + 1 >= questions.length) {
        setSaving(true);
        const success = await saveDNA(newAnswers);
        setSaving(false);

        if (success) {
          const dna = calculateDNA(newAnswers);
          const personality = getPersonalityType(dna);
          toast.success(`You are ${personality.type}!`);
          router.push("/travel-dna/result");
        } else {
          toast.error("Failed to save. Please try again.");
          setIndex(questions.length - 1);
        }
      }
    },
    [answers, index, saveDNA, router]
  );

  if (saving) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-cyan" />
        <p className="text-lg text-gray-soft">Analyzing your Travel DNA...</p>
      </div>
    );
  }

  if (index >= questions.length) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <DNAQuestion
        question={questions[index]}
        questionNumber={index + 1}
        totalQuestions={questions.length}
        onSelect={handleSelect}
      />
    </div>
  );
}
