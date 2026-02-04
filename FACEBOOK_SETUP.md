# How to Get Your Facebook App ID

To allow users to connect their Facebook Pages, you need a "Facebook App".

1.  Go to [developers.facebook.com](https://developers.facebook.com/).
2.  Click **"My Apps"** (top right) -> **"Create App"**.
3.  **Select App Type**: Choose **"Business"**. Click Next.
4.  **Details**:
    *   **Display Name**: `PostOnce`
    *   **Contact Email**: Your email.
    *   Click **Create App**.
5.  **Add Products**:
    *   Find **"Facebook Login for Business"** and click **"Set Up"**.
    *   (If asked, select "Web" as the platform).
6.  **Settings (Basic)**:
    *   Go to **Settings > Basic** in the left sidebar.
    *   **App Domains**: Add `mhribrarhussain.github.io`
    *   **Privacy Policy URL**: You can use a generic one or `https://mhribrarhussain.github.io/postonce/privacy` (we can make this later).
    *   **Save Changes**.
7.  **Facebook Login Settings**:
    *   Go to **Facebook Login > Settings**.
    *   **Valid OAuth Redirect URIs**: Add `https://mhribrarhussain.github.io/postonce/dashboard.html`
    *   **Save**.

### 🟢 Copy Your App ID
1.  Look at the top of the screen.
2.  Copy the **App ID** (a long number).
3.  You will verify the implementation in the next step.
