import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { loginSchema, type LoginInput } from "@lio/core/schemas/auth";
import { supabase } from "@/lib/supabase";
import { Field, Input } from "@/components/ui/Field";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export default function LoginScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginInput) => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
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
              <Text className="text-[30px] font-bold leading-tight text-foreground">Welcome back</Text>
              <Text className="text-[15px] text-muted-foreground">Sign in to Life in One.</Text>
            </View>

            <View className="gap-4">
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
                      autoComplete="password"
                      placeholder="••••••••"
                      value={value ?? ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
              </Field>
            </View>

            <PrimaryButton label="Sign in" loading={submitting} onPress={handleSubmit(onSubmit)} />

            <View className="flex-row justify-center gap-1">
              <Text className="text-[14px] text-muted-foreground">No account?</Text>
              <Link href="/(auth)/register" className="text-[14px] font-semibold text-primary">
                Create one
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
