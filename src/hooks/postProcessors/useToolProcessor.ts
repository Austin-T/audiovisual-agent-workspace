import React from "react";
import { FormComponent } from "../../constants/instructions/FormComponent";
import { SystemInstruction } from "../../constants/instructions/SystemInstruction";
import { Message, PostProcess } from "../assistantManagers/useAgent";
import { ChatCompletionAssistantMessageParam } from "openai/resources";

export interface useToolProcessorProps {
    messages: Message[];
    formComponents: FormComponent[];
    systemInstructions: SystemInstruction[];
    sendToolMessage: (toolId: string, message: string) => void;
    sendToolMessageNoReply: (toolId: string, message: string) => void;
    setFormComponent: (key: string, value: string) => void;
    setSystemInstruction: (key: string, completed: boolean) => void;
}

export const useToolProcessor = ({ messages, formComponents, systemInstructions, sendToolMessage, sendToolMessageNoReply, setFormComponent, setSystemInstruction }: useToolProcessorProps) => {
    const [lastToolCall, setLastToolCall] = React.useState(0);

    React.useEffect(() => {
        for (var i = lastToolCall; i < messages.length; i++) {
            if (messages[i].postProcess != PostProcess.ToolCall) continue;
            messages[i].postProcess = PostProcess.None

            const toolCalls = (messages[i].message as ChatCompletionAssistantMessageParam).tool_calls ?? [];

            toolCalls.forEach(tool => {
                console.log("calling tool", tool.function.name, tool.function.arguments);

                if (tool.function.name.startsWith("READ_")) {
                    const key = tool.function.name.substring("READ_".length);
                    const fieldValue = formComponents.find(field => field.key === key)?.value;
                    if (fieldValue) {
                        sendToolMessage(tool.id, fieldValue);
                    }
                } else if (tool.function.name.startsWith("WRITE_")) {
                    const key = tool.function.name.substring("WRITE_".length);
                    const newFieldValue = JSON.parse(tool.function.arguments).text;
                    setFormComponent(key, newFieldValue);
                    sendToolMessage(tool.id, "WRITE operation was succesful");

                } else if (tool.function.name.startsWith("DONE_")) {
                    const key = tool.function.name.substring("DONE_".length);
                    setSystemInstruction(key, true);
                    sendToolMessageNoReply(tool.id, "DONE operation was succesful");

                } else {
                    console.log("unhandled function call", tool);
                }
            });
        }
            
        setLastToolCall(messages.length);
    }, [messages]);
}
