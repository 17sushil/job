import { Briefcase, Plus, Star, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const STATS = [
  { label: 'Active jobs', value: '0', icon: Briefcase },
  { label: 'Applicants', value: '0', icon: Users },
  { label: 'Top matches', value: '0', icon: Star },
];

export function RecruiterDashboard() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Hire great talent</h1>
          <p className="text-muted-foreground">
            Post jobs and discover candidates whose resumes match your ATS.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Post a job
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {STATS.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
            <Briefcase className="h-6 w-6 text-primary" />
          </span>
          <h2 className="text-lg font-semibold">No job postings yet</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Post your first vacancy (e.g. Java developer needed) and we&apos;ll
            surface the top-matching candidates.
          </p>
          <Button>
            <Plus className="h-4 w-4" />
            Post your first job
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}