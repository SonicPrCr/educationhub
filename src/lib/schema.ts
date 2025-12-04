import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  decimal,
  pgEnum,
  unique,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const levelEnum = pgEnum('level', ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
export const formatEnum = pgEnum('format', ['ONLINE', 'OFFLINE', 'HYBRID'])
export const enrollmentStatusEnum = pgEnum('enrollment_status', [
  'ENROLLED',
  'COMPLETED',
  'DROPPED',
])

// Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  password: text('password'),
  avatar: text('avatar'),
  role: varchar('role', { length: 20 }).default('STUDENT'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Categories
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Institutions
export const institutions = pgTable('institutions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  logo: text('logo'),
  website: varchar('website', { length: 500 }),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Instructors
export const instructors = pgTable('instructors', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  bio: text('bio'),
  avatar: text('avatar'),
  institutionId: integer('institution_id').references(() => institutions.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Courses
export const courses = pgTable(
  'courses',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    image: text('image'),
    duration: integer('duration'), // часы
    level: levelEnum('level'),
    format: formatEnum('format'),
    price: decimal('price', { precision: 10, scale: 2 }),
    categoryId: integer('category_id').references(() => categories.id),
    institutionId: integer('institution_id').references(() => institutions.id),
    instructorId: integer('instructor_id').references(() => instructors.id),
    rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    categoryIdx: index('courses_category_idx').on(table.categoryId),
    institutionIdx: index('courses_institution_idx').on(table.institutionId),
    instructorIdx: index('courses_instructor_idx').on(table.instructorId),
  })
)

// Lessons
export const lessons = pgTable(
  'lessons',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content'),
    videoUrl: text('video_url'),
    order: integer('order').notNull(),
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    courseOrderUnique: unique('lessons_course_order_unique').on(
      table.courseId,
      table.order
    ),
    courseIdx: index('lessons_course_idx').on(table.courseId),
  })
)

// Enrollments
export const enrollments = pgTable(
  'enrollments',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    status: enrollmentStatusEnum('status').default('ENROLLED'),
    progress: integer('progress').default(0), // процент завершения
    enrolledAt: timestamp('enrolled_at').defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    userCourseUnique: unique('enrollments_user_course_unique').on(
      table.userId,
      table.courseId
    ),
    userIdx: index('enrollments_user_idx').on(table.userId),
    courseIdx: index('enrollments_course_idx').on(table.courseId),
  })
)

// Progress
export const progress = pgTable(
  'progress',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: integer('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    completed: boolean('completed').default(false),
    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    userLessonUnique: unique('progress_user_lesson_unique').on(
      table.userId,
      table.lessonId
    ),
    userIdx: index('progress_user_idx').on(table.userId),
    lessonIdx: index('progress_lesson_idx').on(table.lessonId),
  })
)

// Reviews
export const reviews = pgTable(
  'reviews',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(), // 1-5
    comment: text('comment'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userCourseUnique: unique('reviews_user_course_unique').on(
      table.userId,
      table.courseId
    ),
    courseIdx: index('reviews_course_idx').on(table.courseId),
  })
)

// Certificates
export const certificates = pgTable('certificates', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  issuedAt: timestamp('issued_at').defaultNow(),
  certificateNumber: varchar('certificate_number', { length: 255 })
    .unique()
    .notNull(),
})

// Achievements
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  icon: text('icon'),
  earnedAt: timestamp('earned_at').defaultNow(),
})

// Articles
export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  image: text('image'),
  authorId: integer('author_id').references(() => users.id),
  categoryId: integer('category_id').references(() => categories.id),
  published: boolean('published').default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Quizzes
export const quizzes = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  lessonId: integer('lesson_id').references(() => lessons.id, {
    onDelete: 'cascade',
  }),
  courseId: integer('course_id').references(() => courses.id, {
    onDelete: 'cascade',
  }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Quiz Questions
export const quizQuestions = pgTable('quiz_questions', {
  id: serial('id').primaryKey(),
  quizId: integer('quiz_id')
    .notNull()
    .references(() => quizzes.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  type: varchar('type', { length: 50 }).default('multiple_choice'), // multiple_choice, true_false, text
  options: text('options'), // JSON array
  correctAnswer: text('correct_answer').notNull(),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Quiz Attempts
export const quizAttempts = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  quizId: integer('quiz_id')
    .notNull()
    .references(() => quizzes.id, { onDelete: 'cascade' }),
  score: integer('score'),
  totalQuestions: integer('total_questions'),
  completedAt: timestamp('completed_at').defaultNow(),
})

// Assignments
export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  lessonId: integer('lesson_id').references(() => lessons.id, {
    onDelete: 'cascade',
  }),
  courseId: integer('course_id').references(() => courses.id, {
    onDelete: 'cascade',
  }),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Assignment Submissions
export const assignmentSubmissions = pgTable('assignment_submissions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  assignmentId: integer('assignment_id')
    .notNull()
    .references(() => assignments.id, { onDelete: 'cascade' }),
  content: text('content'),
  fileUrl: text('file_url'),
  grade: integer('grade'),
  feedback: text('feedback'),
  submittedAt: timestamp('submitted_at').defaultNow(),
  gradedAt: timestamp('graded_at'),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  progress: many(progress),
  reviews: many(reviews),
  certificates: many(certificates),
  achievements: many(achievements),
  articles: many(articles),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  courses: many(courses),
  articles: many(articles),
}))

export const institutionsRelations = relations(institutions, ({ many }) => ({
  instructors: many(instructors),
  courses: many(courses),
}))

export const instructorsRelations = relations(instructors, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [instructors.institutionId],
    references: [institutions.id],
  }),
  courses: many(courses),
}))

export const coursesRelations = relations(courses, ({ one, many }) => ({
  category: one(categories, {
    fields: [courses.categoryId],
    references: [categories.id],
  }),
  institution: one(institutions, {
    fields: [courses.institutionId],
    references: [institutions.id],
  }),
  instructor: one(instructors, {
    fields: [courses.instructorId],
    references: [instructors.id],
  }),
  lessons: many(lessons),
  enrollments: many(enrollments),
  reviews: many(reviews),
  certificates: many(certificates),
}))

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  progress: many(progress),
  quizzes: many(quizzes),
  assignments: many(assignments),
}))

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}))

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, {
    fields: [progress.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [progress.lessonId],
    references: [lessons.id],
  }),
}))

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [reviews.courseId],
    references: [courses.id],
  }),
}))