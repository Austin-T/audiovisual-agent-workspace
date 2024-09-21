import React from 'react';
import OpenAI from 'openai';
import { ChatCompletion, ChatCompletionAssistantMessageParam, ChatCompletionContentPart, ChatCompletionContentPartImage, ChatCompletionMessage, ChatCompletionMessageParam, ChatCompletionMessageToolCall, ChatCompletionSystemMessageParam, ChatCompletionTool, ChatCompletionToolMessageParam, ChatCompletionUserMessageParam } from 'openai/resources/chat/completions';
import { APIPromise } from 'openai/core';

export enum PostProcess {
    None,
    Image,
    ToolCall,
    Speak,
    SpeakPreloaded
}

export interface Message {
    message: ChatCompletionMessageParam;
    postProcess: PostProcess;
}

export const useAgent = () => {
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [tools, setTools] = React.useState<ChatCompletionTool[]>([])

    const openai = new OpenAI({ apiKey: process.env.REACT_APP_OPENAI_API_KEY, dangerouslyAllowBrowser: true });

    const updateTools = (tools: ChatCompletionTool[]) => {
        setTools(tools);
    }

    const sendMessage = async (message: ChatCompletionMessageParam) => {
        setIsLoading(true);

        try {
            setMessages((prevMessages) => [...prevMessages, { message: message, postProcess: PostProcess.None }]);

            let response: ChatCompletion;
            if (tools.length > 0) {
                response = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [...messages.map(m => m.message), message],
                    tools: tools,
                });
            } else {
                response = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [...messages.map(m => m.message), message],
                });
            }

            const responseContent = response.choices[0].message;
            
            if (responseContent.tool_calls) {
                const assistantMessage: ChatCompletionMessageParam = { role: 'assistant', tool_calls: responseContent.tool_calls };
                setMessages((prevMessages) => [...prevMessages, { message: assistantMessage, postProcess: PostProcess.ToolCall }]);
            } else {
                const assistantMessage: ChatCompletionMessageParam = { role: 'assistant', content: responseContent.content };
                setMessages((prevMessages) => [...prevMessages, { message: assistantMessage, postProcess: PostProcess.Speak }]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendUserMessage = async (message: string) => {
        const userMessage: ChatCompletionMessageParam = { role: 'user', content: message };
        sendMessage(userMessage);
    }

    const sendUserMessageWithImages = async (message: string, images: string[]) => {
        let imageContent: ChatCompletionContentPartImage[] = [];
        for (const image of images) {
            imageContent.push({ type: "image_url", image_url: {url: image, "detail": "low"} });
        }
        const userMessage: ChatCompletionUserMessageParam = { 
            role: 'user',
            content: [
                {
                    type: "text",
                    text: message
                },
                ...imageContent
            ]
        };
        sendMessage(userMessage);
    }

    const sendUserMessageNoReply = (message: string) => {
        const userMessage: ChatCompletionUserMessageParam = { 
            role: 'user',
            content: message
        };
        setMessages((prevMessages) => [...prevMessages, { message: userMessage, postProcess: PostProcess.Image }]);
    }

    const sendSystemMessage = (message: string) => {
        const systemMessage: ChatCompletionSystemMessageParam = { role: 'system', content: message };
        sendMessage(systemMessage);
    }

    const sendSystemMessageNoReply = (message: string) => {
        const systemMessage: ChatCompletionSystemMessageParam = { role: 'system', content: message };
        setMessages((prevMessages) => [...prevMessages, { message: systemMessage, postProcess: PostProcess.None }]);
    }

    const sendToolMessage = (toolCallId: string, toolOutput: string) => {
        const toolMessage: ChatCompletionToolMessageParam = { tool_call_id: toolCallId, role: 'tool', content: toolOutput };
        sendMessage(toolMessage);
    }

    const sendToolMessageNoReply = (toolCallId: string, toolOutput: string) => {
        const toolMessage: ChatCompletionToolMessageParam = { tool_call_id: toolCallId, role: 'tool', content: toolOutput };
        setMessages((prevMessages) => [...prevMessages, { message: toolMessage, postProcess: PostProcess.None }]);
    }

    const setAssistantMessage = (message: string) => {
        const assitantMessage: ChatCompletionAssistantMessageParam = { role: 'assistant', content: message };
        setMessages((prevMessages) => [...prevMessages, { message: assitantMessage, postProcess: PostProcess.Speak }]);
    }

    const setAssistantMessageSpeakPreloaded = (message: string) => {
        const assitantMessage: ChatCompletionAssistantMessageParam = { role: 'assistant', content: message };
        setMessages((prevMessages) => [...prevMessages, { message: assitantMessage, postProcess: PostProcess.SpeakPreloaded }]);
    }
    
    return { messages, isLoading, updateTools, sendUserMessage, sendUserMessageWithImages, sendUserMessageNoReply, sendSystemMessage, sendSystemMessageNoReply, sendToolMessage, sendToolMessageNoReply, setAssistantMessage, setAssistantMessageSpeakPreloaded };
}