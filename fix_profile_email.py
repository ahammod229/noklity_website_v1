import re

with open('pages/account/Profile.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { getProfile, updateProfile, uploadProfileAvatar } from '../../services/profileService';", "import { getProfile, updateProfile, uploadProfileAvatar, updateEmail } from '../../services/profileService';")

pattern = r"      // Email update via Supabase Auth if changed\n      if \(formData\.email !== profile\.email\) \{\n        const \{ error: emailError \} = await supabase\.auth\.updateUser\(\{ email: formData\.email \}\);\n        if \(emailError\) throw emailError;\n      \}"
replacement = """      // Email update via Firebase Auth if changed
      if (formData.email !== profile.email) {
        const emailResult = await updateEmail(formData.email);
        if (!emailResult.success) throw new Error(emailResult.error || 'Failed to update email');
      }"""

content = re.sub(pattern, replacement, content)

with open('pages/account/Profile.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
