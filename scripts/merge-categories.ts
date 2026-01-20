
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const MERGE_MAP: Record<string, string[]> = {
    'Image': ['#Image Generators', '#Image editing', '#Art', '#3D model', '#Avatars', '#Face Swap & DeepFake', '#Fashion'],
    'Video': ['#Video Generators', '#Text-to-video', '#AI Simulation'],
    'Audio': ['#Audio Editing', '#Music', '#Text To Speech', '#Voice Cloning'],
    'Coding': ['#Developer Tools', '#Assistant Code', '#Github Projects', '#AI Agents', '#LLM models', '#Robots and Devices'],
    'Writing': ['#Summarizer', '#E-mail', '#AI detection', '#Education / Studies'],
    'Productivity': ['#Productivity', '#Automation', '#Files & Spreadsheets', '#AI Useful', '#Extensions ChatGPT'],
    'Chat': ['#AI Chat & Assistant', '#ChatBots', '#Customer Support', '#AI Characters', '#AI Girlfriend', '#Dating & Relationships', '#Assistive technology (AT)'],
    'Business': ['#Business', '#Marketing', '#E-commerce', '#Finance', '#Human Resources', '#Data & Analytics']
};

async function main() {
    console.log("Starting Category Merge...");

    for (const [targetName, sourceNames] of Object.entries(MERGE_MAP)) {
        console.log(`\nProcessing ${targetName}...`);

        // 1. Get or Create Target Category
        let { data: target } = await supabase.from('categories').select('id, name').eq('name', targetName).single();

        if (!target) {
            console.log(`Target '${targetName}' not found.`);

            // Try to find one of the sources to promote to target (RENAME)
            // This preserves the ID if possible
            let sourceToPromote = null;
            for (const src of sourceNames) {
                const { data: s } = await supabase.from('categories').select('id, name').eq('name', src).single();
                if (s) {
                    sourceToPromote = s;
                    break;
                }
            }

            if (sourceToPromote) {
                console.log(`Promoting '${sourceToPromote.name}' to '${targetName}'...`);
                const { data: renamed, error } = await supabase.from('categories')
                    .update({
                        name: targetName,
                        slug: targetName.toLowerCase().replace(/\s+/g, '-')
                    })
                    .eq('id', sourceToPromote.id)
                    .select()
                    .single();

                if (error) {
                    console.error("Error promoting category:", error);
                    continue;
                }
                target = renamed;
            } else {
                console.log(`Creating new category '${targetName}'...`);
                const { data: created, error } = await supabase.from('categories')
                    .insert({
                        name: targetName,
                        slug: targetName.toLowerCase().replace(/\s+/g, '-'),
                        icon: 'Bot',
                        tool_count: 0
                    })
                    .select()
                    .single();

                if (error) {
                    console.error("Error creating category:", error);
                    continue;
                }
                target = created;
            }
        }

        if (!target) {
            console.error(`Target '${targetName}' could not be created or found.`);
            continue;
        }

        console.log(`Target: ${target.name} (${target.id})`);

        // 2. Merge Tools from Sources
        for (const sourceName of sourceNames) {
            // Find source category
            const { data: source } = await supabase.from('categories').select('id, name').eq('name', sourceName).single();

            if (!source) {
                // console.log(`Source '${sourceName}' not found.`);
                continue;
            }

            if (source.id === target.id) continue; // Skip if same

            // Update tools
            const { count, error } = await supabase.from('tools')
                .update({ category_id: target.id })
                .eq('category_id', source.id)
                .select(); // Remove invalid arguments for select


            if (error) {
                console.error(`Error moving tools from ${sourceName}:`, error);
            } else {
                console.log(`Moved ${count} tools from '${sourceName}' to '${targetName}'`);

                // Delete empty source category
                const { error: delError } = await supabase.from('categories').delete().eq('id', source.id);
                if (delError) {
                    console.error(`Error deleting ${sourceName}:`, delError);
                } else {
                    console.log(`Deleted category '${sourceName}'`);
                }
            }
        }
    }

    console.log("\nMerge Complete!");
}

main();
