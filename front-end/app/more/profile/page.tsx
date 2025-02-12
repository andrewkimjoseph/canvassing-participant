'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Flex, Text, Input } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import useParticipantStore from '@/stores/useParticipantStore';
import { Avatar, AvatarGroup } from '@/components/ui/avatar';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { SpinnerIconC } from '@/components/icons/spinner-icon';
import { Timestamp } from 'firebase-admin/firestore';
import { Toaster, toaster } from '@/components/ui/toaster';
import { serverTimestamp } from 'firebase/firestore';
import useAmplitudeContext from '@/hooks/useAmplitudeContext';

export default function Profile() {
  const [isMounted, setIsMounted] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  const [newUsername, setNewUsername] = useState('');

  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { participant, getParticipant } = useParticipantStore();

  const { trackAmplitudeEvent } = useAmplitudeContext();

  const updateUsernameFn = async () => {
    setIsUpdatingUsername(true);

    if (newUsername.length < 7 || newUsername.length > 15) {
      toaster.create({
        description: 'Username must be between 7 and 15 characters',
        duration: 3000,
        type: 'warning',
      });

      setIsUpdatingUsername(false);
      return;
    }

    if (participant?.timeUpdated) {
      const timeUpdated = participant.timeUpdated;

      const currentTime = Timestamp.now();
      const timeDifference = currentTime.seconds - timeUpdated.seconds;
      if (timeDifference < 1800) {
        // 1800 seconds in half an hour
        toaster.create({
          description:
            'Wait half an hour before you update your username.',
          duration: 3000,
          type: 'warning',
        });

        setIsUpdatingUsername(false);
        return;
      }
    }

    try {
      await useParticipantStore
        .getState()
        .updateParticipantUsername(newUsername);

      toaster.create({
        description: 'Username updated successfully',
        duration: 3000,
        type: 'success',
      });

      trackAmplitudeEvent('Username updated', {
        walletAddress: address,
      });

      setIsUpdatingUsername(false);
    } catch (error) {
      setIsUpdatingUsername(false);
      toaster.create({
        description: 'Username update failed',
        duration: 3000,
        type: 'error',
      });
    }
  };
  const checkParticipantStatus = useCallback(() => {
    if (isConnected && address) {
      getParticipant(address,  participant?.authId);
    }
  }, [isConnected, address, getParticipant]);

  useEffect(() => {
    checkParticipantStatus();
  }, [checkParticipantStatus]);

  useEffect(() => {
    if (isMounted && !participant) {
      router.replace('/');
    }
  }, [isMounted, participant, router]);

  useEffect(() => {
    setIsMounted(true);
  }, [address, isConnected]);

  if (!isMounted) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <SpinnerIconC />
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column" h="100vh" bgColor="#ECECEC" px={16}>
      <Toaster />
      <Text
        fontSize="3xl"
        fontWeight="bold"
        color="#363062"
        textAlign="center"
        py={3}
      >
        Profile
      </Text>
      <AvatarGroup alignSelf={'center'}>
        <Avatar variant={'solid'} size="2xl" name={participant?.username} />
      </AvatarGroup>
      <Field
        label={
          <Flex flexDirection="row" justifyContent={'space-between'} mt={8}>
            <Text
              fontSize="20px"
              fontWeight="bold"
              color="#363062"
              textAlign="center"
            >
              Username
            </Text>
          </Flex>
        }
      >
        <Input
          placeholder={participant?.username}
          maxLength={15}
          minLength={7}
          onChange={(e) => {
            setNewUsername(e.target.value);
          }}
          border={'solid 2px #363062'}
          borderRadius={10}
          bgColor={'#9D99B4'}
          _placeholder={{ color: 'black', marginLeft: 2 }}
          paddingLeft={2}
        />
      </Field>
      <Field
        label={
          <Flex flexDirection="row" justifyContent={'space-between'} mt={4}>
            <Text
              fontSize="20px"
              fontWeight="bold"
              color="#363062"
              textAlign="center"
            >
              Country
            </Text>
          </Flex>
        }
      >
        <Input
          placeholder={participant?.country}
          _placeholder={{ color: 'black', marginLeft: 2 }}
          variant={'outline'}
          disabled
          border={'solid 2px #363062'}
          borderRadius={10}
          bgColor={'#9D99B4'}
          paddingLeft={2}
        />
      </Field>

      <Field
        label={
          <Flex flexDirection="row" justifyContent={'space-between'} mt={4}>
            <Text
              fontSize="20px"
              fontWeight="bold"
              color="#363062"
              textAlign="center"
            >
              Gender
            </Text>
          </Flex>
        }
      >
        <Input
          placeholder={participant?.gender}
          variant={'outline'}
          disabled
          border={'solid 2px #363062'}
          borderRadius={10}
          _placeholder={{ color: 'black', marginLeft: 2 }}
          bgColor={'#9D99B4'}
          paddingLeft={2}
        />
      </Field>

      <Button
        bgColor={'#363062'}
        borderRadius={15}
        mt={8}
        w={'3/6'}
        alignSelf={'center'}
        onClick={updateUsernameFn}
        disabled={isUpdatingUsername}
        loading={isUpdatingUsername}
        loadingText={<SpinnerIconC />}
      >
        <Text fontSize="8" color="white">
          Save changes
        </Text>
      </Button>
    </Flex>
  );
}
