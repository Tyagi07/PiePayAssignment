import React, {useEffect, useRef, useState} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

type Props = {
  /** Current URL from WebView */
  url: string;
  /** Controls visibility */
  visible: boolean;
  /** Called when user closes sheet or timer hits 0 */
  onClose: () => void;
};

export default function PiePayBottomSheet({url, visible, onClose}: Props) {
  /* ────────────────────────────── State ────────────────────────────── */
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    flipkartPrice: number;
    wowDealPrice: string | null;
    productImgUri: string;
    savingsPercentage: number;
  } | null>(null);
  const [count, setCount] = useState(120); // 2-min timer

  /* ───────────────────── Flipkart product-page checker ─────────────── */
  const isProductPage = (u: string) =>
    u?.includes('flipkart.com') && u?.includes('/p/');

  /* ────────────────── Helper: slug-ify product title ───────────────── */
  const getApiTitle = (u: string) => {
    try {
      const match = u.match(/\/([^/]+)\/p\//);
      if (!match) return 'unknown_product';
      return match[1]
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .toLowerCase()
        .slice(0, 20);
    } catch {
      return 'unknown_product';
    }
  };

  /* ───────────────────────── API round-trip ────────────────────────── */
  const fetchDeal = async (productUrl: string) => {
    setLoading(true);
    const productTitle = getApiTitle(productUrl);

    /* --- POST scraped data (mock Wow-Deal price just for demo) --- */
    const wow = Math.random() > 0.5 ? '₹75,999' : null;
    await fetch('http://10.0.2.2:3000/api/prices', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({productTitle, wowDealPrice: wow}),
    });

    /* --- GET display payload --- */
    const res = await fetch(
      `http://10.0.2.2:3000/api/prices/${productTitle}`,
    ).catch(() => null);

    if (res?.ok) setData(await res.json());
    else
      setData({
        flipkartPrice: 85_000,
        wowDealPrice: wow,
        productImgUri:
          'https://via.placeholder.com/300x200/FF6B35/FFFFFF?text=PiePay+Deal',
        savingsPercentage: wow ? 12 : 0,
      });
    setLoading(false);
  };

  /* ───────────────────── Countdown side effect ─────────────────────── */
  useEffect(() => {
    if (!visible) return;
    setCount(120);
    const id = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(id);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1_000);
    return () => clearInterval(id);
  }, [visible, onClose]);

  /* ───────────────────── Slide-in / out animation ──────────────────── */
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? SCREEN_HEIGHT * 0.3 : SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible, slideAnim]);

  /* ───────────── Trigger API when sheet becomes visible ────────────── */
  useEffect(() => {
    if (visible && isProductPage(url)) fetchDeal(url);
  }, [visible, url]);

  /* ───────────────────────────── Render ─────────────────────────────── */
  if (!visible || !isProductPage(url)) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, {transform: [{translateY: slideAnim}]}]}>
          {/* Close button */}
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeTxt}>✕</Text>
          </Pressable>

          {/* Content */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.loadingTxt}>Finding PiePay deals…</Text>
            </View>
          ) : data ? (
            <View style={styles.centerBox}>
              {/* timer */}
              <View style={styles.timerBadge}>
                <Text style={styles.timerTxt}>
                  ⏰ {Math.floor(count / 60)}:{(count % 60).toString().padStart(2, '0')}
                </Text>
              </View>

              {/* product image */}
              <Image source={{uri: data.productImgUri}} style={styles.img} />

              {/* savings */}
              <View style={styles.saveBadge}>
                <Text style={styles.saveTxt}>Save {data.savingsPercentage}%</Text>
              </View>

              {/* price row */}
              <View style={styles.priceRow}>
                <Text style={styles.oldPrice}>
                  ₹{data.flipkartPrice.toLocaleString()}
                </Text>
                <Text style={styles.arrow}>→</Text>
                <Text style={styles.newPrice}>{data.wowDealPrice ?? data.flipkartPrice}</Text>
              </View>

              <Text style={styles.powered}>Powered by PiePay</Text>
            </View>
          ) : (
            <Text style={styles.errorTxt}>Unable to fetch deal information</Text>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ─────────────────────────── Styles ─────────────────────────── */
const styles = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: SCREEN_HEIGHT * 0.4,
    padding: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeTxt: {color: '#FFF', fontSize: 16, fontWeight: 'bold'},
  centerBox: {alignItems: 'center', paddingTop: 50},
  loadingTxt: {marginTop: 12, fontSize: 16, color: '#666'},
  timerBadge: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    marginRight: 32,
  },
  timerTxt: {color: '#FFF', fontSize: 14, fontWeight: '600'},
  img: {width: 120, height: 120, borderRadius: 8, marginBottom: 16},
  saveBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    marginBottom: 16,
  },
  saveTxt: {color: '#FFF', fontSize: 18, fontWeight: 'bold'},
  priceRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 16},
  oldPrice: {textDecorationLine: 'line-through', fontSize: 16, color: '#999'},
  arrow: {marginHorizontal: 8, fontSize: 18},
  newPrice: {fontSize: 20, fontWeight: 'bold', color: '#FF6B35'},
  powered: {fontSize: 12, color: '#999'},
  errorTxt: {textAlign: 'center', marginTop: 80, fontSize: 16, color: '#666'},
});
