import { redirect } from "next/navigation";

export default async function RecipeDetailRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/nourish/recipes/${slug}`);
}
