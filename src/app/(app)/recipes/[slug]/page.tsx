import Link from "next/link";
import { notFound } from "next/navigation";
import { RECIPES } from "@/lib/recipes/data";
import { cn } from "@/lib/utils";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = RECIPES.find((r) => r.slug === slug);
  if (!recipe) notFound();

  return (
    <article className="space-y-6 pb-8 w-full min-w-0 max-w-full overflow-x-hidden">
      <Link href="/recipes" className="text-sm text-whisper">
        ← back to nook
      </Link>
      <div className={cn("rounded-[28px] p-8 bg-gradient-to-br", recipe.gradient)}>
        <span className="text-5xl">{recipe.emoji}</span>
        <h1 className="font-display text-3xl text-ink mt-4 break-words">{recipe.title}</h1>
        <p className="text-whisper text-sm mt-1">{recipe.time}</p>
      </div>
      <p className="text-ink leading-relaxed break-words">{recipe.description}</p>
      <ol className="space-y-3">
        {recipe.steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm text-ink break-words">
            <span className="font-display text-blush">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
    </article>
  );
}
