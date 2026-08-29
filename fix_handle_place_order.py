import re

with open('pages/Checkout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """      if (result.success && result.orderId) {
        const selectedMethodObj = paymentMethods.find((m) => m.code === paymentMethod);
        
        if (selectedMethodObj?.type === 'mobile_banking') {
          const currentUserId = user?.uid || null;
          // Guest checkouts will have null user_id, which might fail RLS on payment_submissions if user_id is required
          // However, we also save to orders table directly
          try {
            await supabase.from('payment_submissions').insert({
              order_id: result.orderId,
              user_id: currentUserId,
              payment_method: selectedMethodObj.code,
              transaction_reference: bkashTrxId.trim(),
              status: 'pending'
            });
          } catch(e) {
            console.warn('Could not insert payment_submissions, relying on orders table fallback.');
          }

          await supabase
            .from('orders')
            .update({
              transaction_id: bkashTrxId.trim(),
              payment_status: 'pending',
              status: 'Pending'
            })
            .eq('id', result.orderId);

          await clearCart();
          onNavigate('order-success', result.orderId);
          return;
        }

        if (selectedMethodObj?.type === 'bank_transfer') {
          const currentUserId = user?.uid || null;
          let documentPath: string | null = null;
          if (proofFile) {
            const folderName = currentUserId || 'guest';
            const isImage = proofFile.type.startsWith('image/');
            const uploadFile = isImage
              ? (
                  await optimizeImageForUpload(proofFile, {
                    targetWidth: 1600,
                    targetHeight: 1600,
                    fit: 'contain',
                    maxBytes: 3 * 1024 * 1024,
                    fileNamePrefix: `payment-proof-${result.orderId}`
                  })
                ).file
              : proofFile;
            const ext = uploadFile.name.split('.').pop() || (isImage ? 'webp' : 'bin');
            const filePath = `${folderName}/${result.orderId}-${Date.now()}.${ext}`;
            try {
              const { path: newPath } = await supabase.storage.from('payment-proofs').upload(filePath, uploadFile, { upsert: false });
              documentPath = newPath;
            } catch (uploadError) {
              console.error('Failed to upload payment proof:', uploadError);
            }
          }

          try {
            await supabase.from('payment_submissions').insert({
              order_id: result.orderId,
              user_id: currentUserId,
              payment_method: selectedMethodObj.code,
              bank_code: selectedBankCode || null,
              document_type: documentType || null,
              transaction_reference: transactionReference.trim() || null,
              document_path: documentPath,
              status: 'pending'
            });
          } catch(e) {
            console.warn('Could not insert bank transfer payment_submissions.');
          }
          
          await supabase
            .from('orders')
            .update({
              transaction_id: transactionReference.trim() || null,
              payment_status: 'pending',
              status: 'Pending'
            })
            .eq('id', result.orderId);

          await clearCart();
          onNavigate('order-success', result.orderId);
          return;
        }

        // Fallback for Cash on Delivery or generic methods
        await clearCart();
        onNavigate('order-success', result.orderId);
      } else {
        setCheckoutMessage({ type: 'error', text: result.error || 'Failed to process order' });
      }
    } catch (error: any) {"""

pattern = r"      if \(result\.success && result\.orderId\) \{.*?\} catch \(error: any\) \{"
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('pages/Checkout.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
