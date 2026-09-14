import { ZodError } from "zod";
import { ok, fail, failFromError } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/auth/session";
import * as blogService from "@/server/modules/blog/blog.service";

export async function listPublished() {
  try {
    const posts = await blogService.listPublishedBlogPosts();
    return ok(posts);
  } catch (error) {
    console.error("List blog posts error:", error);
    return fail("Could not load blog posts.", 500);
  }
}

export async function getPublishedBySlug(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const post = await blogService.getPublishedBlogPostBySlug(slug);
    if (!post) return fail("Blog post not found.", 404);
    return ok(post);
  } catch (error) {
    console.error("Get blog post error:", error);
    return fail("Could not load blog post.", 500);
  }
}

export async function listAll() {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const posts = await blogService.listAllBlogPosts();
    return ok(posts);
  } catch (error) {
    console.error("List admin blog posts error:", error);
    return fail("Could not load blog posts.", 500);
  }
}

export async function create(request: Request) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const body = await request.json();
    const post = await blogService.createBlogPost(body);
    return ok(post, 201);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not create blog post.");
  }
}

export async function getOne(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  const { slug } = await params;
  const post = await blogService.getBlogPostBySlug(slug);
  if (!post) return fail("Blog post not found.", 404);
  return ok(post);
}

export async function update(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { slug } = await params;
    const body = await request.json();
    const post = await blogService.updateBlogPost(slug, body);
    return ok(post);
  } catch (error) {
    if (error instanceof ZodError) return fail(error.issues[0]?.message ?? "Invalid input.", 400);
    return failFromError(error, "Could not update blog post.");
  }
}

export async function remove(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await requireAdminSession();
  if (!session) return fail("Unauthorized.", 401);

  try {
    const { slug } = await params;
    await blogService.deleteBlogPost(slug);
    return ok({ ok: true });
  } catch (error) {
    return failFromError(error, "Could not delete blog post.");
  }
}
