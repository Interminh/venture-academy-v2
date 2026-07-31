import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";

const TEAM = [
  {
    name: "Violet Ha",
    role: "Club Director",
    bio: "Rising senior at Interlake, passionate about media studies. Favorite subject: English.",
  },
  {
    name: "Minh Do",
    role: "Club Director",
    bio: "Rising junior at Interlake, passionate about coding and tennis. Favorite subject: math.",
  },
  {
    name: "Saahil Shah",
    role: "Club Director",
    bio: "Rising senior at Interlake, passionate about education and poverty alleviation. Favorite subject: chemistry.",
  },
];

export function MissionTeam() {
  return (
    <section className="bg-bg-soft py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-ink">Who we are</h2>
            <p className="mt-2 text-sm text-body">
              A club at Interlake High School providing free tutoring for
              K-8 students in the Bellevue School District.
            </p>
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-ink">Our mission</h2>
            <p className="mt-2 text-sm text-body">
              We help every student we tutor succeed academically, especially
              those who wouldn&apos;t otherwise have access to extra help.
            </p>
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-ink">Our tutors</h2>
            <p className="mt-2 text-sm text-body">
              Entirely Interlake volunteers, matched individually to each
              student rather than assigned at random.
            </p>
          </div>
        </div>

        <h2 className="mt-16 mb-6 text-center font-heading text-2xl font-bold text-ink">
          Meet the directors
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {TEAM.map((person) => (
            <Card key={person.name} className="p-6 text-center">
              <Avatar name={person.name} size="lg" className="mx-auto mb-4" />
              <p className="font-heading font-semibold text-ink">{person.name}</p>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">
                {person.role}
              </p>
              <p className="text-sm text-body">{person.bio}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
