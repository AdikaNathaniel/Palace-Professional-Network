import { Column, FieldGroup, Host, ListItem, RNHostView, Text } from '@expo/ui';
import * as Haptics from 'expo-haptics';
import { Link, router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { useUniwind } from 'uniwind';

import { Avatar } from '@/components/avatar';
import { formModifiers, sectionModifiers } from '@/components/forms/form-modifiers';
import { useFormColors, type FormColors } from '@/components/forms/form-rows';
import { RowActions, rowPressHandler, type RowAction } from '@/components/member/row-actions';
import { Icon, type IconName } from '@/components/ui/icon';
import type { Biodata } from '@/lib/api/types';
import { professionLine, tradeOf } from '@/lib/biodata';
import { openDirectMessage } from '@/lib/chat/navigation';
import { resolveMediaUrl } from '@/lib/config';
import { copyDetail as copy, openContactUrl as openUrl } from '@/lib/contact';

/** A member's page from the directory, or the signed-in member's own. */
export function MemberProfile({ member, isMe }: { member: Biodata; isMe: boolean }) {
  const colors = useFormColors();
  const { theme } = useUniwind();
  // The name joins the navigation bar once the header scrolls away.
  const [headerVisible, setHeaderVisible] = useState(true);

  const trade = tradeOf(member);
  const email = member.email?.trim() || null;
  const phoneActions: RowAction[] = [
    ...(isMe ? [] : [{ label: 'Call', icon: { ios: 'phone', android: 'call' }, onPress: () => void openUrl(`tel:${member.phoneNumber}`) } as RowAction]),
    { label: 'Copy Number', icon: { ios: 'doc.on.doc', android: 'content_copy' }, onPress: () => void copy(member.phoneNumber, 'Phone number') },
  ];
  const emailActions: RowAction[] = email
    ? [
        ...(isMe ? [] : [{ label: 'Send Email', icon: { ios: 'envelope', android: 'mail' }, onPress: () => void openUrl(`mailto:${email}`) } as RowAction]),
        { label: 'Copy Email', icon: { ios: 'doc.on.doc', android: 'content_copy' }, onPress: () => void copy(email, 'Email') },
      ]
    : [];

  return (
    <>
      <Stack.Screen.Title>{headerVisible ? '' : member.fullName}</Stack.Screen.Title>
      <View className="flex-1 bg-background">
        <Host style={{ flex: 1 }} colorScheme={theme === 'dark' ? 'dark' : 'light'}>
          <FieldGroup modifiers={formModifiers(colors.accent)}>
            <FieldGroup.Section
              onAppear={() => setHeaderVisible(true)}
              onDisappear={() => setHeaderVisible(false)}>
              <FieldGroup.SectionHeader>
                <RNHostView matchContents={{ vertical: true }}>
                  <ProfileIdentity member={member} />
                </RNHostView>
              </FieldGroup.SectionHeader>
            </FieldGroup.Section>

            <FieldGroup.Section modifiers={sectionModifiers(colors.surface)}>
              <FieldGroup.SectionHeader>
                <RNHostView matchContents={{ vertical: true }}>
                  <ProfileActions member={member} isMe={isMe} email={email} colors={colors} />
                </RNHostView>
              </FieldGroup.SectionHeader>
              <DetailRow colors={colors} icon={{ ios: 'building.2', android: 'business' }} label="Place of Work" value={member.placeOfWork} />
              <DetailRow colors={colors} icon={{ ios: 'briefcase', android: 'work' }} label="Profession" value={member.professionCategory} />
              {trade ? (
                <DetailRow colors={colors} icon={{ ios: 'hammer', android: 'handyman' }} label="Trade or Business" value={trade} />
              ) : null}
            </FieldGroup.Section>

            <FieldGroup.Section title="Contact" modifiers={sectionModifiers(colors.surface)}>
              <DetailRow colors={colors} icon={{ ios: 'phone', android: 'call' }} label="Phone" value={member.phoneNumber} actions={phoneActions} />
              {email ? (
                <DetailRow colors={colors} icon={{ ios: 'envelope', android: 'mail' }} label="Email" value={email} actions={emailActions} />
              ) : null}
            </FieldGroup.Section>

            <FieldGroup.Section title="About" modifiers={sectionModifiers(colors.surface)}>
              <DetailRow colors={colors} icon={{ ios: 'person', android: 'person' }} label="Age" value={member.ageRange} />
              <DetailRow colors={colors} icon={{ ios: 'figure.stand.dress.line.vertical.figure', android: 'wc' }} label="Gender" value={member.gender} />
              <DetailRow colors={colors} icon={{ ios: 'heart', android: 'favorite' }} label="Marital Status" value={member.maritalStatus} />
            </FieldGroup.Section>
          </FieldGroup>
        </Host>
      </View>
    </>
  );
}

/** Photo, name and what they do. When it scrolls away the name moves to the title bar. */
function ProfileIdentity({ member }: { member: Biodata }) {
  const photoUri = resolveMediaUrl(member.imageUrl);
  return (
    <View className="items-center gap-1 pt-2">
      {photoUri ? (
        <Link href={{ pathname: '/chat/photo', params: { uri: photoUri } }} asChild>
          <Pressable
            accessibilityRole="imagebutton"
            accessibilityLabel={`Photo of ${member.fullName}`}
            accessibilityHint="Opens the photo full screen"
            className="active:opacity-80">
            <Avatar name={member.fullName} imageUrl={member.imageUrl} size={112} />
          </Pressable>
        </Link>
      ) : (
        <Avatar name={member.fullName} size={112} />
      )}
      <RNText selectable accessibilityRole="header" className="mt-3 text-center text-2xl font-bold text-foreground">
        {member.fullName}
      </RNText>
      <RNText selectable className="text-center text-base font-medium text-accent">
        {professionLine(member)}
      </RNText>
    </View>
  );
}

/** Message / Call / Email for other members; Edit Profile on your own. */
function ProfileActions({
  member,
  isMe,
  email,
  colors,
}: {
  member: Biodata;
  isMe: boolean;
  email: string | null;
  colors: FormColors;
}) {
  const message = () =>
    openDirectMessage(member.phoneNumber, { title: member.fullName, imageUrl: member.imageUrl });

  return (
    <View className="pb-3">
      <View className="flex-row gap-2 self-stretch">
        {isMe ? (
          <ActionTile
            label="Edit Profile"
            icon={{ ios: 'pencil', android: 'edit' }}
            colors={colors}
            onPress={() => router.push('/biodata-form')}
          />
        ) : (
          <>
            <ActionTile label="Message" icon={{ ios: 'message.fill', android: 'chat' }} colors={colors} onPress={message} />
            <ActionTile
              label="Call"
              icon={{ ios: 'phone.fill', android: 'call' }}
              colors={colors}
              onPress={() => void openUrl(`tel:${member.phoneNumber}`)}
            />
            {email ? (
              <ActionTile
                label="Email"
                icon={{ ios: 'envelope.fill', android: 'mail' }}
                colors={colors}
                onPress={() => void openUrl(`mailto:${email}`)}
              />
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

/** A Contacts-style action button: icon over a short label. */
function ActionTile({
  label,
  icon,
  colors,
  onPress,
}: {
  label: string;
  icon: IconName;
  colors: FormColors;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ borderCurve: 'continuous' }}
      className="h-16 flex-1 items-center justify-center gap-1 rounded-xl bg-surface active:opacity-60">
      <Icon name={icon} size={20} color={colors.accent} />
      <RNText className="text-xs font-medium text-accent">{label}</RNText>
    </Pressable>
  );
}

function DetailRow({
  icon,
  label,
  value,
  colors,
  actions = [],
}: {
  icon: IconName;
  label: string;
  value: string;
  colors: FormColors;
  actions?: RowAction[];
}) {
  return (
    <RowActions actions={actions}>
      <ListItem
        onPress={rowPressHandler(value, actions)}
        leading={
          <View className="size-7 items-center justify-center">
            <Icon name={icon} size={18} color={colors.accent} />
          </View>
        }>
        <Column alignment="start" spacing={2}>
          <Text textStyle={{ fontSize: 13, color: colors.muted }}>{label}</Text>
          <Text textStyle={{ fontSize: 17, color: colors.foreground }}>{value}</Text>
        </Column>
      </ListItem>
    </RowActions>
  );
}
