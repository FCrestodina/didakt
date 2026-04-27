export type BlockType =
  | 'heading'
  | 'text'
  | 'image'
  | 'video'
  | 'quiz'
  | 'accordion'
  | 'divider'
  | 'bullet-list'
  | 'numbered-list'
  | 'quote'
  | 'callout';

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  content: string;
  level: 1 | 2 | 3;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  caption: string;
  alt: string;
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  url: string;
  caption: string;
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizBlock extends BaseBlock {
  type: 'quiz';
  question: string;
  options: QuizOption[];
  feedback: { correct: string; incorrect: string };
}

export interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

export interface AccordionBlock extends BaseBlock {
  type: 'accordion';
  items: AccordionItem[];
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

export interface BulletListBlock extends BaseBlock {
  type: 'bullet-list';
  items: string[];
}

export interface NumberedListBlock extends BaseBlock {
  type: 'numbered-list';
  items: string[];
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  content: string;
  author: string;
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  variant: 'info' | 'warning' | 'success' | 'tip';
  content: string;
}

export type Block =
  | HeadingBlock
  | TextBlock
  | ImageBlock
  | VideoBlock
  | QuizBlock
  | AccordionBlock
  | DividerBlock
  | BulletListBlock
  | NumberedListBlock
  | QuoteBlock
  | CalloutBlock;

export interface Lesson {
  id: string;
  title: string;
  blocks: Block[];
}

export interface CourseTheme {
  primaryColor: string;
  fontFamily: string;
}

export interface Course {
  _id?: string;
  title: string;
  description: string;
  coverImage?: string;
  theme: CourseTheme;
  lessons: Lesson[];
  status: 'draft' | 'published';
  createdAt?: string;
  updatedAt?: string;
}
