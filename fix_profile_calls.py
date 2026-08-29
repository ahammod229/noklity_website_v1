import re

with open('pages/account/Profile.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('uploadAvatar', 'uploadProfileAvatar')
content = content.replace('await getProfile(user.uid)', 'await getProfile()')
content = content.replace('await updateProfile(user.uid, updates)', 'await updateProfile(updates)')
content = content.replace('await uploadProfileAvatar(user.uid, file)', 'await uploadProfileAvatar(file)')
content = content.replace('full_name: formData.fullName', 'fullName: formData.fullName')

with open('pages/account/Profile.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
