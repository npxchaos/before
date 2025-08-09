"use client";
import { useRouter } from "next/navigation"
import { UrlSubmitForm } from "@/components/forms/url-submit-form/UrlSubmitForm"

export function Hero() {
  const router = useRouter()
  return (
    <section>
      <UrlSubmitForm onSubmitted={(id) => router.push(`/dashboard?submissionId=${id}`)} />
    </section>
  )
}


