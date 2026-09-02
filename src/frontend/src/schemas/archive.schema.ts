import { z } from 'zod';

export const AuthorSchema = z.object({
  name: z.string(),
  isPresenter: z.boolean().optional(),
  institute: z.string().nullable().optional(),
});

export const PresentationFilesSchema = z.object({
  abstract: z.string().optional(),
  slides: z.string().optional(),
  extended_abstract: z.string().optional(),
  poster: z.string().optional(),
  paper: z.string().optional(),
}).catchall(z.string().optional());

export const PresentationSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  authors: z.array(z.union([z.string(), AuthorSchema])).default([]),
  type: z.string().optional(),
  session: z.string().optional(),
  time: z.string().optional(),
  files: PresentationFilesSchema.optional(),
  award: z.string().optional(),
  isKeynote: z.boolean().optional(),
});

export const PosterSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  authors: z.array(z.union([z.string(), AuthorSchema])).default([]),
  files: PresentationFilesSchema.optional(),
  abstract: z.string().optional(),
  session: z.string().optional(),
});

export const SessionSchema = z.object({
  title: z.string(),
  date: z.string().optional(),
  time: z.string().optional(),
  chair: z.string().optional(),
  presentations: z.array(PresentationSchema).default([]),
});

export const ResourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  type: z.string().optional(),
  size: z.string().optional(),
  date: z.string().optional(),
});

export const HostCorporationSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  logo_file: z.string().optional(),
  logo_file_url: z.string().optional(),
}).optional();

export const SponsorSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  image: z.string().optional(),
  year: z.union([z.string(), z.number()]).optional(),
});

export const StudentAwardSchema = z.object({
  name: z.string(),
  award: z.string().optional(),
  affiliation: z.string().optional(),
  title: z.string().optional(),
  presentation_title: z.string().optional(),
  file: z.string().optional(),
  file_url: z.string().optional(),
  year: z.union([z.string(), z.number()]).optional(),
});

export const WorkshopArchiveSchema = z.object({
  year: z.union([z.number(), z.string()]),
  ordinal: z.string(),
  title: z.string().optional(),
  tagline: z.string().optional(),
  dates: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  venue: z.string().optional(),
  address: z.string().optional(),
  venue_url: z.string().optional(),
  hotel: z.string().optional(),
  hotel_address: z.string().optional(),
  hotel_url: z.string().optional(),
  resources: z.array(ResourceSchema).default([]),
  host_corporation: HostCorporationSchema,
  sponsors: z.array(SponsorSchema).default([]),
  student_awards: z.array(StudentAwardSchema).default([]),
  posters: z.array(PosterSchema).default([]),
  sessions: z.array(SessionSchema).default([]),
});

export const MasterWorkshopItemSchema = z.object({
  year: z.union([z.number(), z.string()]),
  number: z.number().optional(),
  title: z.string().optional(),
  tagline: z.string().optional(),
  dates: z.string().optional(),
  city: z.string().optional(),
  location: z.string().optional(),
  venue: z.string().optional(),
  address: z.string().optional(),
  venue_url: z.string().optional(),
  host_corporation: HostCorporationSchema,
  sponsors: z.array(z.any()).optional(),
  student_awards: z.array(z.any()).optional(),
  itinerary: z.array(z.any()).optional(),
  presentations: z.array(z.any()).optional(),
  posters: z.array(z.any()).optional(),
});

export const MasterWorkshopsSchema = z.array(MasterWorkshopItemSchema);

export type WorkshopArchive = z.infer<typeof WorkshopArchiveSchema>;
export type Presentation = z.infer<typeof PresentationSchema>;
export type MasterWorkshopItem = z.infer<typeof MasterWorkshopItemSchema>;
