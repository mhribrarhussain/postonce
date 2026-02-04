# SaaS Architecture Design: Serverless (Supabase + HTML/JS)

## 1. High-Level Architecture
We are shifting to a **Serverless Architecture**. This means we don't manage a backend server (like Node.js or Java). Instead, the Frontend talks directly to the Database (securely) and uses "cloud functions" for heavy tasks.

```mermaid
graph TD
    User[Browser (HTML/JS)] -->|Read/Write Data| Supabase[Supabase (DB + Auth)]
    Supabase -->|Trigger| PgCron[pg_cron (Scheduler)]
    PgCron -->|Invoke| EdgeFunc[Edge Function (The 'Back-end' Logic)]
    EdgeFunc -->|Post Content| SocialAPI[Facebook / LinkedIn / X]
```

---

## 2. Tech Stack Setup (Updated)
This stack drastically reduces complexity and cost.

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | **HTML5 + CSS3 + Vanilla JS** | The user interface. Loaded in browser. |
| **Auth** | **Supabase Auth** | Handles Sign Up, Login, and Social Logins (Google/FB). |
| **Database** | **Supabase (PostgreSQL)** | Stores users, posts, and tokens. |
| **API/Logic** | **Supabase Client (JS)** | `supabase.from('posts').select('*')` |
| **Scheduler** | **Supabase pg_cron** | A database plugin that runs a check every minute. |
| **Worker** | **Supabase Edge Functions** | Secure JavaScript code (server-side) to handle API keys and posting. |

---

## 3. Database Schema (Supabase Optimized)
We will use **Row Level Security (RLS)**. This is CRITICAL. It ensures that User A cannot read User B's posts, even though there is no backend server filtering the requests.

**Tables:**

1.  **profiles** (extends standard `auth.users`)
    *   `id` (UUID, FK -> auth.users)
    *   `plan_tier` (text: 'free', 'pro')
    *   `full_name` (text)

2.  **social_connections**
    *   `id` (uuid)
    *   `user_id` (uuid)
    *   `provider` (text: 'facebook', 'linkedin')
    *   `provider_account_id` (text)
    *   `access_token` (text - **Store Encrypted via Vault or simple encryption if early MVP**)
    *   `name` (text)

3.  **posts**
    *   `id` (uuid)
    *   `user_id` (uuid)
    *   `content` (text)
    *   `media_urls` (jsonb)
    *   `scheduled_at` (timestamp, nullable)
    *   `status` (text: 'draft', 'scheduled', 'published', 'failed')

---

## 4. Scheduling Logic (The "Serverless" Way)
Since we don't have a Node server running 24/7, we use the Database to trigger the work.

1.  **Frontend**: User creates a post with `scheduled_at = '2023-10-10 10:00:00'`.
2.  **Database**: Row is saved in `posts`.
3.  **pg_cron** (Database Extension):
    *   Runs a SQL command every minute: "Find posts where `scheduled_at` <= NOW() AND `status` = 'scheduled'".
    *   For every match, it calls an **Edge Function** (HTTP Request).
4.  **Edge Function**:
    *   Receives the Post ID.
    *   Fetches the secure Token.
    *   Posts to Facebook.
    *   Updates Post Status to `published`.

---

## 5. Security & Keys
*   **Public API Key**: Safe to use in your HTML/JS. It only allows access based on RLS rules (e.g., "Users can only edit their own rows").
*   **Service Role Key**: **NEVER** use this in your HTML/JS. This is only for the Edge Function (the secure server-side script).

---

## 6. Project Folder Structure
Simple, clean, and ready for any static host.

```text
/postonce
  ├── /public
  │   ├── index.html          (Landing & Auth)
  │   ├── dashboard.html      (Main App)
  │   ├── /css
  │   │   ├── style.css       (Global Styles)
  │   │   └── dashboard.css   (App Specific)
  │   ├── /js
  │   │   ├── supabase.js     (Client Config)
  │   │   ├── auth.js         (Login/Signup Logic)
  │   │   ├── app.js          (Dashboard Logic)
  │   │   └── calendar.js     (Scheduling Logic)
  │   └── /assets             (Images/Icons)
  │
  ├── /supabase
  │   ├── /functions          (Edge Functions)
  │   │   └── publish-post    (The secured posting script)
  │   └── config.toml
```

## 7. Next Steps for Implementation
1.  **Frontend**: Create the HTML/CSS skeleton for the Dashboard.
2.  **Supabase Setup**: Create the project, tables, and enable Auth.
3.  **Connection**: Link the JS `supabase-client` to the live project.
