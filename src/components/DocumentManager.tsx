import React, { useState, useEffect } from 'react';
import { Box, Paper, TextField, IconButton, Stack, Typography, Tooltip, CardMedia } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { FormComponent, presetFormComponents } from '../constants/instructions/FormComponent';
import { Add, Delete, NoteAdd } from '@mui/icons-material';

interface DocumentManagerProps {
    formComponents: FormComponent[];
    getAllCacheKeys: () => string[];
    clearCacheEntry: (key: string) => void;
    saveToCache: (key: string, components: FormComponent[]) => void;
    loadFromCache: (key: string) => FormComponent[];
    updateParent(formComponents: FormComponent[]): void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ formComponents, getAllCacheKeys, clearCacheEntry, saveToCache, loadFromCache, updateParent }) => {
    const [cacheKeys, setCacheKeys] = useState<string[]>([]);
    const [selectedKey, setSelectedKey] = useState<string>('');
    const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({});
    const [editedKeys, setEditedKeys] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        // Get all cache keys with the common prefix
        let keys = getAllCacheKeys();
        if (keys.length == 0) {
            keys = ['Untitled'];
        }
        setCacheKeys(keys);
        setSelectedKey(keys[0]);
    }, []);

    const handleEditStart = (key: string) => {
        setEditMode({ ...editMode, [key]: true });
        setEditedKeys({ ...editedKeys, [key]: key });
    };

    const handleEditSubmit = (oldKey: string) => {
        const newKey = dedupeNewKey(editedKeys[oldKey]);
        const components = loadFromCache(oldKey);
        clearCacheEntry(oldKey);
        saveToCache(newKey, components);
        setCacheKeys(getAllCacheKeys());
        setEditMode({ ...editMode, [oldKey]: false });
    };

    const handleEditValueUpdate = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, key: string) => {
        setEditedKeys({ ...editedKeys, [key]: event.target.value });
    };

    const handleLoad = (key: string) => {
        // save current to cache
        saveToCache(selectedKey, formComponents);

        // create new
        const components = loadFromCache(key);
        updateParent(components);
        setSelectedKey(key);
    };

    const handleDelete = (key: string) => {
        console.log("deleting", key);
        clearCacheEntry(key);

        let newKeys = getAllCacheKeys()
        console.log("newKeys", newKeys);
        if (newKeys.length == 0) {
            newKeys = ['Untitled'];
            updateParent(presetFormComponents);
        } else {
            const components = loadFromCache(newKeys[0]);
            updateParent(components);
        }
        setCacheKeys(newKeys);
        setSelectedKey(newKeys[0]);
    };

    const handleAdd = () => {
        // save current to cache
        saveToCache(selectedKey, formComponents);

        // create new
        let newKey = dedupeNewKey('Untitled');
        saveToCache(newKey, presetFormComponents);
        updateParent(presetFormComponents);
        setCacheKeys(getAllCacheKeys());
        setSelectedKey(newKey);
    };

    const dedupeNewKey = (key: string): string => {
        if (!getAllCacheKeys().includes(key)) {
            return key;
        }

        let modifier = 1;
        while (getAllCacheKeys().includes(key + modifier)) {
            modifier++;
        }
        return key + modifier;
    }

    return (
        <Stack spacing={2} sx={{ width: "100%", height: "100%", overflowY: 'scroll' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: "100%" }}>
                <Typography variant="h6">Recents</Typography>
                <Tooltip title="New Form">
                    <IconButton onClick={() => handleAdd()}>
                        <NoteAdd />
                    </IconButton>
                </Tooltip>
            </Box>
            {cacheKeys.map((key) => (
                <Box key={key} sx={{ width: "100%", boxSizing: 'border-box' }}>
                    <Paper style={{ padding: 16, display: 'flex', alignItems: 'center', width: "100%", boxSizing: 'border-box', justifyContent: 'space-between', border: key == selectedKey ? '1px solid #1976d2' : 'none' }}>
                        {editMode[key] ? (
                            <TextField
                                value={editedKeys[key]}
                                onChange={(event) => handleEditValueUpdate(event, key)}
                                variant={key == selectedKey ? 'filled' : 'outlined'}
                                size="small"
                                style={{ marginRight: 8 }}
                            />
                        ) : (
                            <Typography
                                noWrap
                                sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                }}
                                onClick={() => handleLoad(key)}
                            >
                                {key}
                            </Typography>
                        )}

                        {editMode[key] ? (
                            <Tooltip title="Save">
                                <IconButton onClick={() => handleEditSubmit(key)}>
                                    <SaveIcon />
                                </IconButton>
                            </Tooltip>
                        ) : (
                            <div style={{ whiteSpace: 'nowrap' }}>
                                <Tooltip title="Change Title">
                                    <IconButton onClick={() => handleEditStart(key)}>
                                        <EditIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                    <IconButton onClick={() => handleDelete(key)}>
                                        <Delete />
                                    </IconButton>
                                </Tooltip>
                            </div>
                        )}
                    </Paper>
                </Box>
            ))}
        </Stack>
    );
};
