import { useCallback } from 'react';
import { FormComponent } from '../../constants/instructions/FormComponent';

export const useFileExporter = () => {
    const CACHE_KEY_PREFIX = "av-agent-workspace/form-components";

    const downloadMarkdown = useCallback((components: FormComponent[]) => {
        // Generate markdown content
        const markdownContent = components.map(component => `# ${component.description}\n\n${component.value}\n`).join('\n');

        // Create a blob with the markdown content
        const blob = new Blob([markdownContent], { type: 'text/markdown' });

        // Create a link element
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'form.md';

        // Append the link to the body
        document.body.appendChild(link);

        // Programmatically click the link to trigger the download
        link.click();

        // Remove the link from the document
        document.body.removeChild(link);
    }, []);

    const getAllCacheKeys = useCallback((): string[] => {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_KEY_PREFIX)) {
                keys.push(key.substring(CACHE_KEY_PREFIX.length + 1));
            }
        }
        return keys;
    }, []);

    const saveToCache = useCallback((key: string, components: FormComponent[]) => {
        const jsonString = JSON.stringify(components);
        localStorage.setItem(`${CACHE_KEY_PREFIX}/${key}`, jsonString);
    }, []);
    
    const loadFromCache = useCallback((key: string): FormComponent[] => {
        const jsonString = localStorage.getItem(`${CACHE_KEY_PREFIX}/${key}`);
        if (jsonString) {
            return JSON.parse(jsonString) as FormComponent[];
        }
        return [];
    }, []);

    const clearCacheEntry = (key: string) => {
        localStorage.removeItem(`${CACHE_KEY_PREFIX}/${key}`);
    };

    return { downloadMarkdown, saveToCache, loadFromCache, getAllCacheKeys, clearCacheEntry };
};
