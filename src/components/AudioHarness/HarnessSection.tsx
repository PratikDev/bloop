import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface HarnessSectionProps {
  title: string;
  phase: number;
  description: string;
  children: ReactNode;
}

/** One card per build phase, so each phase's manual checks live together. */
export default function HarnessSection({ title, phase, description, children }: HarnessSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Badge variant="outline">Phase {phase}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
}
