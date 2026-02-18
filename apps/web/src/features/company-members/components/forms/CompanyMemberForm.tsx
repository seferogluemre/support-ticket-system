import { Button } from '#/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card';
import { Checkbox } from '#/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '#/components/ui/form';
import { Input } from '#/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { Switch } from '#/components/ui/switch';
import { api } from '#/lib/api';
import { typeboxResolver } from '#/lib/resolver';
import {
  OrganizationType,
  type RoleResponseDto,
} from '#/types/api';
import { Gender } from '@onlyjs/db/enums';
import { type Static } from '@sinclair/typebox';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { companyMembersStoreDto, companyMembersUpdateDto } from '../../schemas';

type CreateFormSchema = Static<typeof companyMembersStoreDto.body>;
type UpdateFormSchema = Static<typeof companyMembersUpdateDto.body>;

export type CompanyMemberFormSubmitData = (CreateFormSchema | UpdateFormSchema);

interface CompanyMemberFormProps {
  mode: "create" | "update" | "edit";
  companyUuid: string;
  defaultValues?: Partial<CreateFormSchema | UpdateFormSchema>;
  onSubmit: (data: CompanyMemberFormSubmitData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function CompanyMemberForm({
  mode,
  companyUuid,
  defaultValues = {},
  onSubmit,
  onCancel,
  isLoading = false,
}: CompanyMemberFormProps) {
  const [passwordValue, setPasswordValue] = useState('');
  
  const isCreateMode = mode === 'create';
  const schema = isCreateMode ? companyMembersStoreDto.body : companyMembersUpdateDto.body;

  // Fetch roles from backend
  const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles', companyUuid],
    queryFn: async () => {
      if (!companyUuid) return null;
      const response = await api.auth.roles.get({
        query: {
          // @ts-expect-error Eden Treaty query type mismatch
          organizationType: OrganizationType.COMPANY,
          organizationUuid: companyUuid,
        },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    enabled: !!companyUuid,
  });

  const roles: RoleResponseDto[] = rolesResponse || [];
  const isLoadingOptions = rolesLoading;

  // Simple password policy for validation
  const passwordPolicy = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  };

  const form = useForm<CreateFormSchema | UpdateFormSchema>({
    resolver: typeboxResolver(schema),
    defaultValues: isCreateMode 
      ? {
          createUser: {
            email: "",
            password: "",
            firstName: "",
            lastName: "",
            gender: Gender.MALE,
            isActive: true,
          },
          roleUuids: [],
          ...defaultValues,
        } as CreateFormSchema
      : {
          user: {
            firstName: "",
            lastName: "",
            email: "",
            gender: Gender.MALE,
            isActive: true,
          },
          roleUuids: [],
          ...defaultValues,
        } as UpdateFormSchema,
  });

  // Auto-select basic role when roles load (create mode only)
  useEffect(() => {
    if (isCreateMode && roles.length > 0) {
      const currentRoles = form.getValues('roleUuids') as string[] | undefined;
      if (!currentRoles || currentRoles.length === 0) {
        const basicRole = roles.find((role) => role.type === 'BASIC');
        if (basicRole) {
          form.setValue('roleUuids', [basicRole.uuid]);
        }
      }
    }
  }, [roles, form, isCreateMode]);

  const handleFormSubmit = (data: CreateFormSchema | UpdateFormSchema) => {
    // Validate: At least one role must be assigned
    if (!data.roleUuids || data.roleUuids.length === 0) {
      form.setError('roleUuids', {
        type: 'manual',
        message: 'En az bir rol seçilmelidir',
      });
      return;
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {isCreateMode ? 'New Member' : 'Edit Member'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isCreateMode
              ? 'Create a new member with access to the company'
              : 'Update member information and roles'}
          </p>
        </div>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={isCreateMode ? 'createUser.firstName' : 'user.firstName'}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={isCreateMode ? 'createUser.lastName' : 'user.lastName'}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name={isCreateMode ? 'createUser.email' : 'user.email'}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="member@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password field - required for create, optional for edit */}
            <FormField
              control={form.control}
              name={isCreateMode ? 'createUser.password' : 'user.password'}
              render={({ field }) => {
                const hasMinLength = passwordValue.length >= passwordPolicy.minLength;
                const hasMaxLength = passwordValue.length <= passwordPolicy.maxLength;
                const hasUppercase = !passwordPolicy.requireUppercase || /[A-Z]/.test(passwordValue);
                const hasLowercase = !passwordPolicy.requireLowercase || /[a-z]/.test(passwordValue);
                const hasNumber = !passwordPolicy.requireNumbers || /[0-9]/.test(passwordValue);
                const hasSpecial = !passwordPolicy.requireSpecialChars || /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(passwordValue);

                return (
                  <FormItem>
                    <FormLabel>
                      {isCreateMode ? 'Password *' : 'New Password'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={isCreateMode ? '••••••••' : 'Leave empty to keep current password'}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e);
                          setPasswordValue(e.target.value);
                        }}
                      />
                    </FormControl>
                    {/* Show password requirements only when user starts typing */}
                    {(isCreateMode || passwordValue) && (
                      <FormDescription>
                        {!isCreateMode && (
                          <span className="block mb-2">
                            Only fill this if you want to change the password
                          </span>
                        )}
                        <span className={`block ${passwordValue && !hasMinLength ? 'text-destructive' : ''}`}>
                          • Must be at least {passwordPolicy.minLength} characters long
                        </span>
                        <span className={`block ${passwordValue && !hasMaxLength ? 'text-destructive' : ''}`}>
                          • Must not exceed {passwordPolicy.maxLength} characters
                        </span>
                        {passwordPolicy.requireUppercase && (
                          <span className={`block ${passwordValue && !hasUppercase ? 'text-destructive' : ''}`}>
                            • Must contain at least one uppercase letter (A-Z)
                          </span>
                        )}
                        {passwordPolicy.requireLowercase && (
                          <span className={`block ${passwordValue && !hasLowercase ? 'text-destructive' : ''}`}>
                            • Must contain at least one lowercase letter (a-z)
                          </span>
                        )}
                        {passwordPolicy.requireNumbers && (
                          <span className={`block ${passwordValue && !hasNumber ? 'text-destructive' : ''}`}>
                            • Must contain at least one number (0-9)
                          </span>
                        )}
                        {passwordPolicy.requireSpecialChars && (
                          <span className={`block ${passwordValue && !hasSpecial ? 'text-destructive' : ''}`}>
                            • Must contain at least one special character (!@#$%...)
                          </span>
                        )}
                      </FormDescription>
                    )}
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name={isCreateMode ? 'createUser.gender' : 'user.gender'}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Gender.MALE}>Male</SelectItem>
                      <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                      <SelectItem value={Gender.NON_BINARY}>
                        Non-Binary
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={isCreateMode ? 'createUser.isActive' : 'user.isActive'}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Enable or disable this user account
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name='roleUuids'
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Roles *</FormLabel>
                    <FormDescription>
                      Assign roles to define permissions (at least one required)
                    </FormDescription>
                  </div>
                  {isLoadingOptions ? (
                    <div className="text-sm text-muted-foreground">
                      Loading roles...
                    </div>
                  ) : roles.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No roles available
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                      {roles
                        .sort((a, b) => a.order - b.order)
                        .map((role) => (
                          <FormField
                            key={role.uuid}
                            control={form.control}
                            name='roleUuids'
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={role.uuid}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(
                                        role.uuid
                                      )}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...(field.value || []),
                                              role.uuid,
                                          ])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value: string) => value !== role.uuid
                                            )
                                          );
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-normal">
                                      {role.name}
                                    </FormLabel>
                                    {role.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {role.description}
                                      </p>
                                    )}
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isLoadingOptions}>
            {isLoading ? 'Saving...' : isCreateMode ? 'Create Member' : 'Update Member'}
          </Button>
        </div>
      </form>
    </Form>
  );
}