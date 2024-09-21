import { ChatCompletionTool } from "openai/resources/chat/completions";

export type FormComponent = {
    key: string;
    description: string;
    value: string;
    tool: {
        read: ChatCompletionTool;
        write: ChatCompletionTool;
        other?: ChatCompletionTool[];
    };
};

export const presetFormComponents: FormComponent[] = [
    {
        key: "1",
        description: "The details of the crime",
        value: "",
        tool: {
            read: {
                type: "function",
                function: {
                    name: "READ_1",
                    description: "Reaturns the content in field 1",
                    parameters: {}
                }
            },
            write: {
                type: "function",
                function: {
                    name: "WRITE_1",
                    description: "Adds content to field 1. Will overwrite any existing content.",
                    parameters: {
                        type: "object",
                        properties: {
                            text: { 
                                type: "string",
                                description: "The content to add to field 1"
                            }
                        },
                        required: ["text"]
                    }
                }
            }
            
        }
    },
    {
        key: "2",
        description: "The witnesses of the crime",
        value: "",
        tool: {
            read: {
                type: "function",
                function: {
                    name: "READ_2",
                    description: "Reaturns the content in field 2",
                    parameters: {}
                }
            },
            write: {
                type: "function",
                function: {
                    name: "WRITE_2",
                    description: "Adds content to field 2. Will overwrite any existing content.",
                    parameters: {
                        type: "object",
                        properties: {
                            text: { 
                                type: "string",
                                description: "The content to add to field 2"
                            }
                        },
                        required: ["text"]
                    }
                }
            }
            
        }
    },
    {
        key: "3",
        description: "The evidence of the crime",
        value: "",
        tool: {
            read: {
                type: "function",
                function: {
                    name: "READ_3",
                    description: "Reaturns the content in field 3",
                    parameters: {}
                }
            },
            write: {
                type: "function",
                function: {
                    name: "WRITE_3",
                    description: "Adds content to field 3. Will overwrite any existing content.",
                    parameters: {
                        type: "object",
                        properties: {
                            text: { 
                                type: "string",
                                description: "The content to add to field 3"
                            }
                        },
                        required: ["text"]
                    }
                }
            }
            
        }
    },
]