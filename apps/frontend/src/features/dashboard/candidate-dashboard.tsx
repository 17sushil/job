import {
  FileText,
  FolderOpen,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const STATS = [
  { label: 'Jobs matched', value: '0', icon: Search },
  { label: 'Applications', value: '0', icon: FolderOpen },
  { label: 'Resumes generated', value: '0', icon: Sparkles },
];

export function CandidateDashboard() {
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Find your next opportunity
        </h1>
        <p className="text-muted-foreground">
          Search jobs, upload your resume, and get an ATS-ready version in
          under 30 seconds.
        </p>
      </section>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search jobs by title, company or skill…"
          />
        </div>
        <Button>Search</Button>
      </div>

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
            <Upload className="h-6 w-6 text-primary" />
          </span>
          <h2 className="text-lg font-semibold">
            Build your profile from your resume
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Upload your resume and JobDev will parse it, fill your profile, and
            match you with the right jobs.
          </p>
          <Button>
            <FileText className="h-4 w-4" />
            Upload resume
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
