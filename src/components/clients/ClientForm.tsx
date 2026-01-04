"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClientContext } from "@/context/ClientContext";
import {
  clientSchema,
  ClientFormValues,
  CLIENT_STATUSES,
} from "@/types/client";
import { Loader2, Save, X, Phone, Mail, MapPin, FileText, User, DollarSign } from "lucide-react";

interface ClientFormProps {
  clientId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ClientForm({ clientId, onSuccess, onCancel }: ClientFormProps) {
  const { clients, createClient, updateClient, loading } = useClientContext();

  const existingClient = clientId
    ? clients.find((c) => c.id === clientId)
    : null;

  const form = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      outstandingBalance: 0,
      status: "active",
    },
  });

  useEffect(() => {
    if (existingClient) {
      form.reset({
        name: existingClient.name,
        contactName: existingClient.contactName || "",
        email: existingClient.email || "",
        phone: existingClient.phone || "",
        address: existingClient.address || "",
        notes: existingClient.notes || "",
        outstandingBalance: existingClient.outstandingBalance,
        status: existingClient.status,
      });
    }
  }, [existingClient, form]);

  async function onSubmit(data: ClientFormValues) {
    if (clientId) {
      await updateClient(clientId, data);
    } else {
      await createClient(data);
    }
    if (onSuccess) onSuccess();
  }

  const labelStyles = "text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-1 flex items-center gap-2";
  const inputStyles = "h-10 rounded-xl border-2 border-gray-100 bg-white/50 focus:bg-white focus:border-primary/20 focus:ring-0 transition-all font-bold text-sm placeholder:font-medium placeholder:text-muted-foreground/30";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={labelStyles}>
                  <User className="w-3 h-3" /> Client Name *
                </FormLabel>
                <FormControl>
                  <Input placeholder="Company or Individual" className={inputStyles} {...field} />
                </FormControl>
                <FormMessage className="text-[10px] font-bold mt-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={labelStyles}>
                  <User className="w-3 h-3 opacity-50" /> Primary Contact
                </FormLabel>
                <FormControl>
                  <Input placeholder="Full Name" className={inputStyles} {...field} />
                </FormControl>
                <FormMessage className="text-[10px] font-bold mt-1" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={labelStyles}>
                  <Mail className="w-3 h-3" /> Email Address
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="client@verify.com"
                    className={inputStyles}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-[10px] font-bold mt-1" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={labelStyles}>
                  <Phone className="w-3 h-3" /> Phone Number
                </FormLabel>
                <FormControl>
                  <Input placeholder="Call Identity" className={inputStyles} {...field} />
                </FormControl>
                <FormMessage className="text-[10px] font-bold mt-1" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel className={labelStyles}>
                <MapPin className="w-3 h-3" /> Physical Address
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Street, City, Postcode"
                  className={inputStyles + " min-h-[60px] h-18 py-2 resize-none"}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-[10px] font-bold mt-1" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!clientId && (
            <FormField
              control={form.control}
              name="outstandingBalance"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormLabel className={labelStyles}>
                    <DollarSign className="w-3 h-3" /> Opening Balance
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className={inputStyles + " pl-10"}
                        value={
                          field.value === null || field.value === undefined
                            ? ""
                            : String(field.value)
                        }
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold mt-1" />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={labelStyles}>Account Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className={inputStyles + " capitalize"}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    {CLIENT_STATUSES.map((status) => (
                      <SelectItem
                        key={status}
                        value={status}
                        className="capitalize font-bold text-xs py-2.5"
                      >
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px] font-bold mt-1" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel className={labelStyles}>
                <FileText className="w-3 h-3" /> Internal Records
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Administrative observations..."
                  className={inputStyles + " min-h-[60px] h-18 py-2 resize-none"}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-[10px] font-bold mt-1" />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="h-10 px-6 rounded-xl border-2 font-black text-xs uppercase tracking-widest hover:bg-gray-50"
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={loading} 
            className="h-10 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-black text-xs uppercase tracking-widest min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />{" "}
                {clientId ? "Commit Updates" : "Register Client"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

