"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Book,
  Mail,
  Phone,
  MessageCircle,
  FileText,
  Info,
  ExternalLink,
  LifeBuoy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function HelpPage() {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t("help.faq.q1"),
      answer: t("help.faq.a1"),
    },
    {
      question: t("help.faq.q2"),
      answer: t("help.faq.a2"),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("help.title")}</h1>
        <p className="text-muted-foreground">{t("help.subtitle")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Documentation Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              {t("help.documentation.title")}
            </CardTitle>
            <CardDescription>
              {t("help.documentation.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => window.open('/docs', '_blank')}>
              <FileText className="mr-2 h-4 w-4" />
              {t("help.documentation.link")}
            </Button>
          </CardContent>
        </Card>

        {/* Contact Support Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="h-5 w-5 text-primary" />
              {t("help.contact.title")}
            </CardTitle>
            <CardDescription>{t("help.contact.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium leading-none">
                  {t("help.contact.email")}
                </p>
                <p className="text-sm text-muted-foreground">
                  support@fixary.com
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium leading-none">
                  {t("help.contact.phone")}
                </p>
                <p className="text-sm text-muted-foreground">+1 (555) 000-0000</p>
              </div>
            </div>
            <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              {t("help.contact.available")}
            </div>
          </CardContent>
        </Card>

         {/* Resources Card */}
         <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-primary" />
              {t("help.resources.title")}
            </CardTitle>
            <CardDescription>
              Additional learning specific to your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
             <Button variant="ghost" className="w-full justify-start h-auto py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mr-3">
                     <Book className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex flex-col items-start">
                    <span className="font-medium">{t("help.resources.videoTutorials")}</span>
                    <span className="text-xs text-muted-foreground">Watch step-by-step guides</span>
                </div>
             </Button>
             <Button variant="ghost" className="w-full justify-start h-auto py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mr-3">
                     <MessageCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex flex-col items-start">
                    <span className="font-medium">{t("help.resources.community")}</span>
                    <span className="text-xs text-muted-foreground">Join the conversation</span>
                </div>
             </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
         {/* FAQ Section */}
        <Card className="md:col-span-1">
            <CardHeader>
                <CardTitle>{t("help.faq.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {faqs.map((faq, index) => (
                    <div key={index} className="space-y-2">
                        <h4 className="font-medium text-sm leading-none flex items-center gap-2">
                            <Info className="h-3 w-3 text-muted-foreground" />
                            {faq.question}
                        </h4>
                        <p className="text-sm text-muted-foreground pl-5">
                            {faq.answer}
                        </p>
                        {index < faqs.length - 1 && <Separator className="my-2" />}
                    </div>
                ))}
            </CardContent>
        </Card>

        {/* System Info */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>{t("help.systemInfo.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">
                {t("help.systemInfo.version")}
              </span>
              <Badge variant="outline">v1.0.0</Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">
                {t("help.systemInfo.status")}
              </span>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">
                {t("help.systemInfo.lastUpdated")}
              </span>
              <span className="text-sm font-medium">May 15, 2024</span>
            </div>
             <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">
                Client ID
              </span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                FIX-8829-XJ
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
