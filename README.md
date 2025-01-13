# Eggenda

Privacy-focused and open-source weekly task agenda with no distractions.

## Features

### Task Management

- 📅 Weekly grid view with customizable work days
- ✨ Create, edit, and delete tasks
- 🎨 Color-code tasks for better organization
- ✅ Mark tasks as complete/incomplete
- 📎 Attach files to tasks
- 💬 Add comments to tasks
- 🔍 Search through all tasks
- 📱 Responsive design for mobile and desktop

### Task Organization

- 📋 Drag and drop tasks between days
- 📦 Unscheduled tasks pool
- 🗄️ Archive completed tasks
- 🔄 Move uncompleted tasks to next day
- 📊 Print weekly view

### URL Features

- 🔗 Automatic URL title fetching
- 🌐 Clickable links in tasks
- 🏷️ URL preview with titles

### User Experience

- ⌨️ Keyboard shortcuts (⌘+Enter for new task, ⌘+A for archive)
- 🌓 Dark mode support
- ⚡ Real-time updates
- 🔐 User authentication
- ⚙️ Customizable settings

## Setup

### Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Create the following tables in your Supabase database:

```sql
-- Tasks table
create table tasks (
id uuid default uuid_generate_v4() primary key,
created_at timestamp with time zone default timezone('utc'::text, now()) not null,
updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
title text not null,
description text,
status text default 'todo'::text,
task_date date,
week_number integer,
year integer,
color text,
row_index integer,
user_id uuid references auth.users(id),
attachments jsonb[],
metadata jsonb,
archived_at timestamp with time zone
);
-- Comments table
create table comments (
id uuid default uuid_generate_v4() primary key,
created_at timestamp with time zone default timezone('utc'::text, now()) not null,
updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
task_id uuid references tasks(id) on delete cascade,
user_id uuid references auth.users(id),
content text not null
);
-- Enable Row Level Security
alter table tasks enable row level security;
alter table comments enable row level security;
-- Create policies
create policy "Users can view their own tasks"
on tasks for select
using (auth.uid() = user_id);
create policy "Users can insert their own tasks"
on tasks for insert
with check (auth.uid() = user_id);
create policy "Users can update their own tasks"
on tasks for update
using (auth.uid() = user_id);
create policy "Users can delete their own tasks"
on tasks for delete
using (auth.uid() = user_id);
-- Similar policies for comments
create policy "Users can view comments on their tasks"
on comments for select
using (auth.uid() in (
select user_id from tasks where id = task_id
));
create policy "Users can insert comments on their tasks"
on comments for insert
with check (auth.uid() in (
select user_id from tasks where id = task_id
));
```

3. Set up storage buckets:

   - Create a new bucket called `task_attachments`
   - Set up appropriate policies for file access

4. Create a `.env.local` file with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Keyboard Shortcuts

- `⌘/Ctrl + Enter` - Create new task for today
- `⌘/Ctrl + A` - Archive current task (in task detail view)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.
