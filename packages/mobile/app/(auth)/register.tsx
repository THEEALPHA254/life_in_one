import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { registerSchema, type RegisterInput } from "@lio/core/schemas/auth";
import { supabase } from "@/lib/supabase";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export default function RegisterScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterInput) => {
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: values.display_name ? { data: { display_name: values.display_name } } : undefined,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("Check your email to confirm your account.");
      router.replace("/(auth)/login");
      return;
    }
    toast.success("Account created");
    router.replace("/(app)");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
          <View className="gap-8">
            <View className="gap-2">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary">
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>Lo</Text>
              </View>
              <Text className="text-[30px] font-bold leading-tight text-foreground">Create account</Text>
              <Text className="text-[15px] text-muted-foreground">One account — every module.</Text>
            </View>

            <View className="gap-4">
              <Field label="Display name" error={errors.display_name?.message}>
                <Controller
                  control={control}
                  name="display_name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input autoComplete="name" placeholder="Grace" value={value ?? ""} onChangeText={onChange} onBlur={onBlur} />
                  )}
                />
              </Field>

              <Field label="Email" error={errors.email?.message}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={value ?? ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
              </Field>

              <Field label="Password" error={errors.password?.message}>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      secureTextEntry
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={value ?? ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
              </Field>
            </View>

            <PrimaryButton label="Create account" loading={submitting} onPress={handleSubmit(onSubmit)} />

            <View className="flex-row justify-center gap-1">
              <Text className="text-[14px] text-muted-foreground">Have an account?</Text>
              <Link href="/(auth)/login" className="text-[14px] font-semibold text-primary">
                Sign in
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
