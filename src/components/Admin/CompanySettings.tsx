import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { showError, showSuccess } from "@/lib/toast";
import { useCompany } from "@/routes/_auth/_app/$companySlug/route";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/Button";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Flex } from "../ui/Flex";
import { Input } from "../ui/form";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Switch } from "../ui/Switch";
import { Typography } from "../ui/Typography";

interface CompanySettingsFormData {
  defaultMaxHoursPerWeek: number;
  defaultMaxHoursPerDay: number;
  requiresTimeApproval: boolean;
  billingEnabled: boolean;
}

export function CompanySettings() {
  const { companyId, companyName } = useCompany();
  const company = useQuery(api.companies.getCompany, { companyId });
  const updateCompany = useMutation(api.companies.updateCompany);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CompanySettingsFormData | null>(null);

  const settings = company?.settings;

  // Initialize form data when company loads
  useEffect(() => {
    if (settings && !formData) {
      setFormData({ ...settings });
    }
  }, [settings, formData]);

  const handleSave = async () => {
    if (!formData) return;

    setIsSubmitting(true);
    try {
      await updateCompany({
        companyId,
        settings: formData,
      });
      showSuccess("Company settings updated");
    } catch (error) {
      showError(error, "Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setFormData({ ...settings });
    }
  };

  const hasChanges =
    settings &&
    formData &&
    (formData.defaultMaxHoursPerWeek !== settings.defaultMaxHoursPerWeek ||
      formData.defaultMaxHoursPerDay !== settings.defaultMaxHoursPerDay ||
      formData.requiresTimeApproval !== settings.requiresTimeApproval ||
      formData.billingEnabled !== settings.billingEnabled);

  if (!(company && formData)) {
    return (
      <Card>
        <CardBody>
          <Flex justify="center" className="py-8">
            <LoadingSpinner />
          </Flex>
        </CardBody>
      </Card>
    );
  }

  return (
    <Flex direction="column" gap="xl">
      {/* Header */}
      <div>
        <Typography variant="h2" className="text-2xl font-bold">
          Company Settings
        </Typography>
        <Typography variant="muted" className="mt-1">
          Configure settings for {companyName}
        </Typography>
      </div>

      {/* Time Tracking Settings */}
      <Card>
        <CardHeader
          title="Time Tracking"
          description="Configure default time tracking settings for your organization"
        />
        <CardBody>
          <Flex direction="column" gap="lg">
            {/* Default Max Hours Per Week */}
            <div>
              <label
                htmlFor="maxHoursPerWeek"
                className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2"
              >
                Default Max Hours Per Week
              </label>
              <Input
                id="maxHoursPerWeek"
                type="number"
                min={1}
                max={168}
                value={formData.defaultMaxHoursPerWeek}
                onChange={(e) =>
                  setFormData({ ...formData, defaultMaxHoursPerWeek: Number(e.target.value) })
                }
                className="max-w-[120px]"
              />
              <Typography variant="muted" className="mt-1 text-sm">
                Maximum hours a team member can log per week
              </Typography>
            </div>

            {/* Default Max Hours Per Day */}
            <div>
              <label
                htmlFor="maxHoursPerDay"
                className="block text-sm font-medium text-ui-text-primary dark:text-ui-text-primary-dark mb-2"
              >
                Default Max Hours Per Day
              </label>
              <Input
                id="maxHoursPerDay"
                type="number"
                min={1}
                max={24}
                value={formData.defaultMaxHoursPerDay}
                onChange={(e) =>
                  setFormData({ ...formData, defaultMaxHoursPerDay: Number(e.target.value) })
                }
                className="max-w-[120px]"
              />
              <Typography variant="muted" className="mt-1 text-sm">
                Maximum hours a team member can log per day
              </Typography>
            </div>

            {/* Requires Time Approval */}
            <Flex align="center" justify="between" className="py-2">
              <div>
                <Typography variant="p" className="font-medium">
                  Require Time Approval
                </Typography>
                <Typography variant="muted" className="text-sm">
                  Time entries must be approved by a manager before being finalized
                </Typography>
              </div>
              <Switch
                checked={formData.requiresTimeApproval}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requiresTimeApproval: checked })
                }
                aria-label="Require time approval"
              />
            </Flex>
          </Flex>
        </CardBody>
      </Card>

      {/* Billing Settings */}
      <Card>
        <CardHeader
          title="Billing & Invoicing"
          description="Configure billing features for your organization"
        />
        <CardBody>
          <Flex direction="column" gap="lg">
            {/* Billing Enabled */}
            <Flex align="center" justify="between" className="py-2">
              <div>
                <Typography variant="p" className="font-medium">
                  Enable Billing Features
                </Typography>
                <Typography variant="muted" className="text-sm">
                  Allow team members to mark time entries as billable. When disabled, the billable
                  checkbox will be hidden from time entry forms.
                </Typography>
              </div>
              <Switch
                checked={formData.billingEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, billingEnabled: checked })}
                aria-label="Enable billing features"
              />
            </Flex>
          </Flex>
        </CardBody>
      </Card>

      {/* Save Button */}
      <Flex gap="md">
        <Button onClick={handleSave} isLoading={isSubmitting} disabled={!hasChanges}>
          Save Changes
        </Button>
        {hasChanges && (
          <Button variant="secondary" onClick={handleReset} disabled={isSubmitting}>
            Reset
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
