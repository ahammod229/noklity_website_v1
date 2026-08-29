import fs from 'fs';
let content = fs.readFileSync('pages/admin/Products.tsx', 'utf8');

const payloadStart = 'const payload = {';
const payloadIndex = content.indexOf(payloadStart);

let newContent = content.replace(
  'is_flash_sale: formData.isFlashSale,',
  'is_flash_sale: formData.isFlashSale,\n      video_url: formData.videoUrl || null,\n      video_provider: formData.videoProvider || null,'
);

// After inserting or updating the product, handle variants.
const updateBlock = `if (editingProduct) {
      const { error: updateError } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingProduct.id);

      if (updateError) throw updateError;
      
      // Update variants
      await supabase.from('product_variants').delete().eq('product_id', editingProduct.id);
      if (formData.variants && formData.variants.length > 0) {
        const variantsData = formData.variants.map(v => ({
           product_id: editingProduct.id,
           name: v.name,
           price: v.price,
           stock: v.stock,
           sku: v.sku,
           image_url: v.image_url || null
        }));
        await supabase.from('product_variants').insert(variantsData);
      }
      
    } else {
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert([payload])
        .select()
        .single();

      if (insertError) throw insertError;
      
      // Insert variants
      if (newProduct && formData.variants && formData.variants.length > 0) {
        const variantsData = formData.variants.map(v => ({
           product_id: newProduct.id,
           name: v.name,
           price: v.price,
           stock: v.stock,
           sku: v.sku,
           image_url: v.image_url || null
        }));
        await supabase.from('product_variants').insert(variantsData);
      }
    }`;

const oldSubmitBlockRegex = /if \(editingProduct\) \{[\s\S]*?if \(insertError\) throw insertError;\n    \}/;
newContent = newContent.replace(oldSubmitBlockRegex, updateBlock);

fs.writeFileSync('pages/admin/Products.tsx', newContent);

