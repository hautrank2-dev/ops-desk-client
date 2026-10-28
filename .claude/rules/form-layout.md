---
paths:
  - "src/**/*Form*.tsx"
  - "src/components/**/index.tsx"
  - "src/app/**/*.tsx"
---

# Bố cục form — `Field*` của shadcn

**Ưu tiên**, không tuyệt đối: form bình thường (nhập liệu, sửa thông tin, form
trong dialog) dựng theo khung dưới. Form đặc biệt (thanh filter, ô comment kéo
thả ảnh, editor inline, wizard) được làm khác — nhưng vẫn cố giữ cùng các khối
`Field`, `FieldLabel`, `FieldError` để nhìn đồng nhất.

Component ở `@/components/ui/field`: `FieldSet`, `FieldLegend`, `FieldGroup`,
`Field`, `FieldContent`, `FieldLabel`, `FieldTitle`, `FieldDescription`,
`FieldSeparator`, `FieldError`.

## Khung chuẩn

```tsx
<FieldSet>
  <FieldLegend>Profile</FieldLegend>
  <FieldDescription>This appears on invoices and emails.</FieldDescription>
  <FieldGroup>
    <Field>
      <FieldLabel htmlFor="name">Full name</FieldLabel>
      <Input id="name" autoComplete="off" placeholder="Evil Rabbit" />
      <FieldDescription>This appears on invoices and emails.</FieldDescription>
    </Field>
    <Field data-invalid>
      <FieldLabel htmlFor="username">Username</FieldLabel>
      <Input id="username" autoComplete="off" aria-invalid />
      <FieldError>Choose another username.</FieldError>
    </Field>
    <Field orientation="horizontal">
      <Switch id="newsletter" />
      <FieldLabel htmlFor="newsletter">Subscribe to the newsletter</FieldLabel>
    </Field>
  </FieldGroup>
</FieldSet>
```

- `FieldSet` + `FieldLegend` cho mỗi nhóm có nghĩa (Info, Assignment, Images…);
  form một nhóm vẫn bọc `FieldSet`, legend có thể ẩn bằng `className="sr-only"`.
- Các ô nằm trong **một** `FieldGroup`; hai ô trên một hàng thì đặt
  `<div className="grid gap-4 sm:grid-cols-2">` bên trong `FieldGroup`.
- Checkbox / Switch / Radio dùng `orientation="horizontal"`, control đứng
  **trước** label.
- `FieldDescription` dưới control = gợi ý; dưới `FieldLegend` = mô tả nhóm.
- Nút submit / cancel nằm ngoài `FieldSet`, cuối form, căn phải.

## Nối với react-hook-form + zod

Dùng `Controller` (không dùng `FormField` / `FormItem` / `FormMessage` cũ cho
form mới), lấy lỗi từ `fieldState`:

```tsx
<Controller
  control={form.control}
  name="title"
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid || undefined}>
      <FieldLabel htmlFor={field.name}>Title</FieldLabel>
      <Input id={field.name} aria-invalid={fieldState.invalid} {...field} />
      <FieldError errors={[fieldState.error]} />
    </Field>
  )}
/>
```

- `id` của control = `field.name`, `htmlFor` của label trùng `id`.
- Lỗi luôn đi qua `FieldError` (`errors={[...]}`), không tự viết `<p className="text-destructive">`.
- Đặt cả `data-invalid` trên `Field` **và** `aria-invalid` trên control
  (`SelectTrigger`, `Input`, `Textarea`) để màu lỗi và a11y đúng.
- Select gắn server (User, Asset…) dùng `XSelect` theo `select-async.md`,
  vẫn nằm trong `Field` như ô thường.

## Hiện trạng

Ví dụ đã theo khung: `src/components/assets/AssetItemSection/AssetItemForm.tsx`.
`TicketForm`, `AssetForm`, `TicketComment` còn dùng `Form` / `FormField` /
`FormItem` cũ — chuyển dần khi sửa tới, không refactor hàng loạt khi không được yêu cầu.
