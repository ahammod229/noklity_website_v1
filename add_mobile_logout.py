with open("components/account/AccountSidebar.tsx", "r") as f:
    c = f.read()

btn = """        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap text-[10px] font-black uppercase tracking-wide transition-all bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
          type="button"
        >
          <LogOut className="w-3 h-3" />
          Logout
        </button>"""

c = c.replace(
    '        <button\n          onClick={() => setTheme(theme === \'dark\' ? \'light\' : \'dark\')}',
    btn + '\n        <button\n          onClick={() => setTheme(theme === \'dark\' ? \'light\' : \'dark\')}'
)

with open("components/account/AccountSidebar.tsx", "w") as f:
    f.write(c)
