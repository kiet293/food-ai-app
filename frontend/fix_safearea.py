import os, re

dir_path = r'd:\code\pyton\food-ai-app\frontend\app'
safe_area_context_import = "import { SafeAreaView } from 'react-native-safe-area-context';\n"

for root, dirs, files in os.walk(dir_path):
    for file in files:
        if file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'SafeAreaView' in content and 'react-native-safe-area-context' not in content:
                def replacer(match):
                    imports = match.group(1)
                    if 'SafeAreaView' in imports:
                        imports = re.sub(r'\bSafeAreaView\b\s*,?', '', imports)
                        imports = re.sub(r',\s*,', ',', imports)
                        imports = re.sub(r'{\s*,', '{ ', imports)
                        imports = re.sub(r',\s*}', ' }', imports)
                        return f'import {{{imports}}} from \'react-native\';'
                    return match.group(0)
                
                new_content = re.sub(r'import\s+{([^}]+)}\s+from\s+[\'\"`]react-native[\'\"`];?', replacer, content)
                
                if new_content != content:
                    new_content = safe_area_context_import + new_content
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f'Updated {filepath}')
