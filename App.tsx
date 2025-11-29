import { use, useEffect, useRef, useState } from 'react';
import {
  Button,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VolumeSlider from './src/component/VolumeSlider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import axios from 'axios';
import { Icon } from 'react-native-elements';

const STORAGE_KEY = 'device_ip';

type SystemInfo = {
  manufacturer?: string;
  version?: string;
  serial?: string;
  os?: string;
  virtual?: boolean;
  type?: string; // Using a literal type for 'type' since it's a specific string
};

function App() {
  const theme = useColorScheme();
  const [isModalVisible, setModalVisible] = useState(false);
  const [ip, setIp] = useState('');
  const [volume, setVolume] = useState(0);
  const [savedIp, setSavedIp] = useState<string | null>(null);
  const MAC_IP = `http://${savedIp}:3000`;
  const source = useRef<ReturnType<typeof axios.CancelToken.source> | null>(
    null,
  );
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({});

  useEffect(() => {
    // Load saved IP from storage on app start
    const loadSavedIp = async () => {
      try {
        const storedIp = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedIp) {
          console.log('🚀 ~ loadSavedIp ~ storedIp:', storedIp);
          setSavedIp(storedIp);
          setIp(storedIp);
          setModalVisible(false); // Hide modal if IP was already saved
        } else {
          setModalVisible(true);
        }
      } catch (error) {
        console.error('Failed to load IP:', error);
      }
    };

    loadSavedIp().finally(() => {
      getSystemInfo();
    });
  }, []);

  const handleOk = async () => {
    try {
      const trimmedIp = ip.trim();
      await AsyncStorage.setItem(STORAGE_KEY, trimmedIp);
      setSavedIp(trimmedIp);
      setModalVisible(false);
      console.log('Saved IP:', trimmedIp);
      getSystemInfo();
    } catch (error) {
      console.error('Failed to save IP:', error);
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const getSystemInfo = async () => {
    try {
      let res = await axios.get(`${MAC_IP}/mac-info`);
      console.log('🚀 ~ getSystemInfo ~ res:', res.data);
      setSystemInfo(res.data);
    } catch (err) {
      console.log('🚀 ~ getSystemInfo ~ err:', err);
    }
  };

  const sendCommand = async (command: string | number) => {
    // Cancel previous request if it exists
    if (source?.current) {
      source?.current.cancel('Previous request cancelled');
    }

    source.current = axios.CancelToken.source();

    try {
      await axios.get(`${MAC_IP}/volume/${command}`, {
        cancelToken: source?.current?.token,
      });
      console.log('worked..');
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log('Previous request cancelled');
      } else {
        console.error('Error sending volume command:', error.message);
        ToastAndroid.show(
          error.message || 'Failed to send command',
          ToastAndroid.LONG,
        );
      }
    }
  };

  return (
    <GestureHandlerRootView
      style={[
        styles.container,
        { backgroundColor: theme === 'dark' ? 'black' : 'white' },
      ]}
    >
      <StatusBar barStyle={'dark-content'} />

      <View
        style={[
          {
            position: 'absolute',
            alignSelf: 'center',
            top: 60,
            width: '90%',
            backgroundColor: '#4CAF50',
            borderRadius: 30,
            paddingHorizontal: 15,
            paddingVertical: 10,
          },
          styles.inlineView,
        ]}
      >
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              // padding: 10,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 100,
              height: 50,
              width: 50,
              backgroundColor: '#ffffff32',
            }}
          >
            <Icon
              type="font-awesome"
              name={
                systemInfo.manufacturer === 'Apple Inc.' ? 'apple' : 'windows'
              }
              size={30}
              color={'white'}
            />
          </View>
          {/* <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            {systemInfo?.manufacturer}
          </Text> */}
        </View>
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            {systemInfo.version}
          </Text>
          <Text style={{ color: 'white', fontSize: 14 }}>{systemInfo.os}</Text>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
            IP: {savedIp}
          </Text>
        </View>
        <Icon
          type="font-awesome"
          name="edit"
          onPress={() => setModalVisible(true)}
          size={25}
          color={'white'}
        />
      </View>
      <Text
        style={{
          color: theme === 'dark' ? 'white' : 'black',
          fontSize: 30,
          marginBottom: 10,
        }}
      >
        {volume.toFixed(0)}%
      </Text>

      <VolumeSlider
        height={400}
        width={80}
        onChangeValue={val => {
          setVolume(Number(val.toFixed(2)) * 100);
          sendCommand(Number(val.toFixed(2)) * 100);
        }}
      />

      <Modal isVisible={isModalVisible}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Enter Device IP</Text>
          <TextInput
            value={ip}
            onChangeText={setIp}
            placeholder="e.g. 192.168.0.101"
            style={styles.input}
            keyboardType="numeric"
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOk} style={styles.okBtn}>
              <Text style={styles.btnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    marginBottom: 12,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    color: 'black',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  okBtn: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 5,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 5,
  },
  btnText: {
    color: 'white',
    fontWeight: '600',
  },
  inlineView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

export default App;
